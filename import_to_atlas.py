"""
Import database_export_light.json into MongoDB Atlas
Usage: python import_to_atlas.py
"""
import json
from pymongo import MongoClient

ATLAS_URL = "mongodb+srv://anajjar955_db_user:TXyPkLjltMs827iv@cluster0.udnfnwj.mongodb.net"
DB_NAME = "pmhouse_academy"
EXPORT_FILE = "database_export_light.json"

# Collections that contain placeholder audio data (skip audio_base64 fields)
SKIP_PLACEHOLDER_FIELDS = ["audio_base64"]

def import_data():
    print("🔌 Connecting to MongoDB Atlas...")
    client = MongoClient(ATLAS_URL)
    db = client[DB_NAME]
    
    print(f"📂 Reading {EXPORT_FILE}...")
    with open(EXPORT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for collection_name, documents in data.items():
        if not documents:
            print(f"  ⏭️  {collection_name}: empty, skipping")
            continue
        
        # Clean documents
        clean_docs = []
        for doc in documents:
            # Remove MongoDB _id to let Atlas generate new ones
            doc.pop('_id', None)
            
            # Skip placeholder audio data
            for field in SKIP_PLACEHOLDER_FIELDS:
                if field in doc and isinstance(doc[field], str) and doc[field].startswith('<'):
                    doc.pop(field)
            
            clean_docs.append(doc)
        
        # Drop existing collection and insert fresh
        db[collection_name].drop()
        db[collection_name].insert_many(clean_docs)
        print(f"  ✅ {collection_name}: {len(clean_docs)} documents imported")
    
    print(f"\n🎉 Done! All data imported to '{DB_NAME}' on Atlas")
    print(f"⚠️  Note: audio_cache collection imported without audio binary data")
    print(f"    Audio will be regenerated automatically when users open lessons")
    
    client.close()

if __name__ == "__main__":
    import_data()
