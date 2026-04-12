"""
Pre-generate all audio narrations for all slides using ElevenLabs (Haytham voice).
Run once to cache all audio so users don't wait.
"""
import asyncio
import os
import sys
import base64
import hashlib
import time
from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from elevenlabs import ElevenLabs
from elevenlabs.types import VoiceSettings

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ.get('DB_NAME', 'pmhouse_academy')
ELEVENLABS_KEY = os.environ['ELEVENLABS_API_KEY']
ELEVENLABS_VOICE = os.environ.get('ELEVENLABS_VOICE_ID', 'IES4nrmZdUBHByLBde0P')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
el_client = ElevenLabs(api_key=ELEVENLABS_KEY)

async def generate_narration(slide_content: str, cache_key: str) -> str:
    """Generate Egyptian Arabic narration using GPT"""
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        sid = f"el_{hashlib.md5(cache_key.encode()).hexdigest()[:8]}"
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=sid,
            system_message="أنت مدرب مصري متخصص في إدارة المشاريع. بتشرح بالعامية المصرية الطبيعية زي ما بتتكلم مع صحابك."
        )
        chat = chat.with_model("openai", "gpt-4o-mini")
        prompt = f"""اشرح المحتوى ده كأنك مدرب مصري بتشرح في فيديو:

{slide_content}

اكتب شرح بالعامية المصرية الطبيعية في حدود 100-130 كلمة.
- ابدأ بمقدمة حماسية قصيرة
- اشرح بهدوء مع أمثلة من الواقع
- اختم بخلاصة سريعة
- استخدم كلمات مصرية: دلوقتي، كده، عشان، يعني، بتاع، حاجة، إزاي، ليه
- اكتب كلام متصل بدون عناوين أو نقاط
- خلي الكلام طبيعي زي حد بيتكلم مش بيقرأ
- مهم جداً: ضع تشكيل كامل على كل الكلمات العربية (فتحة، ضمة، كسرة، سكون، شدة، تنوين) عشان القراءة تكون مظبوطة 100%"""
        narration = await chat.send_message(UserMessage(text=prompt))
        return narration.strip()[:4096]
    except Exception as e:
        print(f"  GPT failed: {e}")
        return slide_content

def generate_audio(text: str) -> bytes:
    """Generate audio using ElevenLabs Haytham voice"""
    audio_gen = el_client.text_to_speech.convert(
        text=text,
        voice_id=ELEVENLABS_VOICE,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=0.35,
            similarity_boost=0.85,
            style=0.7,
            use_speaker_boost=True
        )
    )
    audio_data = b""
    for chunk in audio_gen:
        audio_data += chunk
    return audio_data

async def main():
    # Clear old cache
    deleted = await db.audio_cache.delete_many({})
    print(f"Cleared {deleted.deleted_count} old cached audio entries\n")

    # Get all lessons
    lessons = await db.lessons.find({}, {"_id": 0}).sort("module_id", 1).to_list(100)
    print(f"Found {len(lessons)} lessons\n")

    total_slides = 0
    total_generated = 0
    total_bytes = 0
    errors = []

    for lesson in lessons:
        lesson_id = lesson["id"]
        slides = lesson.get("slides", [])
        print(f"📖 Lesson {lesson_id}: {lesson['title']} ({len(slides)} slides)")

        for slide_idx, slide in enumerate(slides):
            total_slides += 1
            cache_key = f"{lesson_id}_{slide_idx}_el1"

            # Build slide content
            slide_content = f"عنوان: {slide['title']}\nمحتوى: {slide.get('content', '')}\n"
            key_points = slide.get('key_points', [])
            if key_points:
                slide_content += "نقاط: " + " / ".join(key_points)

            try:
                # Step 1: Generate narration
                print(f"  🎤 Slide {slide_idx + 1}/{len(slides)}: Generating narration...", end=" ", flush=True)
                narration = await generate_narration(slide_content, cache_key)
                print(f"({len(narration)} chars)", end=" ", flush=True)

                # Step 2: Generate audio
                print("→ Audio...", end=" ", flush=True)
                audio_data = generate_audio(narration)
                total_bytes += len(audio_data)
                print(f"({len(audio_data)} bytes)", end=" ", flush=True)

                # Step 3: Cache
                audio_b64 = base64.b64encode(audio_data).decode("utf-8")
                await db.audio_cache.update_one(
                    {"cache_key": cache_key},
                    {"$set": {
                        "cache_key": cache_key,
                        "audio_base64": audio_b64,
                        "narration_text": narration,
                        "created_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
                    }},
                    upsert=True
                )
                total_generated += 1
                print("✅")

                # Small delay to respect rate limits
                time.sleep(0.5)

            except Exception as e:
                print(f"❌ Error: {e}")
                errors.append(f"{lesson_id}/slide_{slide_idx}: {e}")

        print()

    # Summary
    print("=" * 60)
    print(f"✅ Generated: {total_generated}/{total_slides} audio files")
    print(f"📦 Total size: {total_bytes / (1024*1024):.1f} MB")
    if errors:
        print(f"❌ Errors ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("🎉 All audio generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
