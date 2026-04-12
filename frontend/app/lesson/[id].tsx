import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useLang } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LessonViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { lang, t, isRTL } = useLang();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentSlideRef = useRef(0);
  const [currentSlide, setCurrentSlideState] = useState(0);
  const isMountedRef = useRef(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

  const setCurrentSlide = (val: number) => {
    currentSlideRef.current = val;
    setCurrentSlideState(val);
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchLesson();
    return () => { isMountedRef.current = false; cleanupAudio(); };
  }, [id]);

  // When language changes, restart audio for current slide
  useEffect(() => {
    if (lesson && isMountedRef.current) {
      cleanupAudio();
      setTimeout(() => { if (isMountedRef.current) startAudio(currentSlideRef.current); }, 600);
    }
  }, [lang]);

  const fetchLesson = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/course/lessons/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLesson(data.lesson);
        setTimeout(() => { if (isMountedRef.current) startAudio(0); }, 800);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) { /* ignore */ }
    if (isMountedRef.current) setAudioPlaying(false);
  };

  const startAudio = async (slideIndex: number) => {
    await cleanupAudio();
    if (!isMountedRef.current) return;

    setAudioLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      // Use English endpoint when lang is 'en'
      const audioUrl = lang === 'en'
        ? `${BACKEND_URL}/api/audio/slide/${id}/${slideIndex}/en`
        : `${BACKEND_URL}/api/audio/slide/${id}/${slideIndex}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: playbackSpeed, shouldCorrectPitch: true }
      );
      if (!isMountedRef.current) { await sound.unloadAsync(); return; }
      soundRef.current = sound;
      setAudioPlaying(true);
      setAudioLoading(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!isMountedRef.current) return;
        if (status.isLoaded && status.didJustFinish) {
          setAudioPlaying(false);
          soundRef.current = null;
          const currentIdx = currentSlideRef.current;
          if (lesson && currentIdx < (lesson.slides?.length || 0) - 1) {
            // Auto-advance to next slide
            const nextIdx = currentIdx + 1;
            goToSlideAndPlay(nextIdx);
          } else if (lesson) {
            // Last slide finished - auto-advance to next lesson
            markComplete();
            autoAdvanceToNextLesson();
          }
        }
      });
    } catch (e) {
      console.log('Audio error:', e);
      if (isMountedRef.current) setAudioLoading(false);
    }
  };

  const toggleAudio = async () => {
    if (audioPlaying) {
      await cleanupAudio();
    } else {
      await startAudio(currentSlideRef.current);
    }
  };

  const cycleSpeed = async () => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextSpeed = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackSpeed(nextSpeed);
    if (soundRef.current) {
      try { await soundRef.current.setRateAsync(nextSpeed, true); } catch (e) {}
    }
  };

  const goToSlideAndPlay = (index: number) => {
    cleanupAudio();
    setCurrentSlide(index);
    setTimeout(() => { if (isMountedRef.current) startAudio(index); }, 600);
  };

  const markComplete = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/course/lessons/${id}/complete`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  };

  const autoAdvanceToNextLesson = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/course/lessons/${id}/next`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.next_lesson && data.next_lesson.is_accessible) {
          setTimeout(() => {
            if (isMountedRef.current) router.replace(`/lesson/${data.next_lesson.id}`);
          }, 1500);
        }
      }
    } catch (e) { console.log('Auto-advance failed:', e); }
  };

  const handleNext = () => {
    if (!lesson) return;
    if (currentSlideRef.current < lesson.slides.length - 1) {
      goToSlideAndPlay(currentSlideRef.current + 1);
    } else {
      cleanupAudio();
      markComplete();
      router.push(`/quiz/${id}`);
    }
  };

  const handlePrev = () => {
    if (currentSlideRef.current > 0) {
      goToSlideAndPlay(currentSlideRef.current - 1);
    }
  };

  const handleBack = () => {
    cleanupAudio();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/course');
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  if (!lesson) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loader}>
        <Text style={{ fontSize: 16, color: '#64748B' }}>{t('الدرس غير متاح', 'Lesson not available')}</Text>
        <TouchableOpacity style={styles.backFallback} onPress={() => router.replace('/(tabs)/course')}>
          <Text style={styles.backFallbackText}>{t('العودة للدورة', 'Back to Course')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const slides = lesson.slides || [];
  const currentItem = slides[currentSlide];
  const rowDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  // Get content based on language
  const slideTitle = lang === 'en' ? (currentItem?.title_en || currentItem?.title) : currentItem?.title;
  const slideContent = lang === 'en' ? (currentItem?.content_en || currentItem?.content) : currentItem?.content;
  const keyPoints = lang === 'en' ? (currentItem?.key_points_en || currentItem?.key_points || []) : (currentItem?.key_points || []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <TouchableOpacity testID="lesson-back-btn" onPress={handleBack} style={styles.topBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color="#1B365D" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {lang === 'en' ? (lesson.title_en || lesson.title) : lesson.title}
          </Text>
          <Text style={styles.topSub}>{lesson.duration_minutes} {t('دقائق', 'min')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.audioBar, { flexDirection: rowDir }]}>
        <TouchableOpacity testID="play-audio-btn" style={[styles.audioBtn, audioPlaying && styles.audioBtnActive]}
          onPress={toggleAudio} disabled={audioLoading}>
          {audioLoading ? <ActivityIndicator size="small" color="#fff" /> :
            <Ionicons name={audioPlaying ? 'pause' : 'play'} size={20} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <Text style={[styles.audioLabel, { textAlign }]}>
            {audioLoading
              ? t('جاري التحميل...', 'Loading...')
              : audioPlaying
                ? t('الصوت شغال', 'Playing')
                : t('اضغط لتشغيل الصوت أو سيعمل تلقائياً', 'Tap to play or auto-plays')}
          </Text>
        </View>
        <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed}>
          <Text style={styles.speedBtnText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.dots, { flexDirection: rowDir }]}>
        {slides.map((_: any, i: number) => (
          <TouchableOpacity key={i} onPress={() => goToSlideAndPlay(i)}>
            <View style={[styles.dot, i === currentSlide && styles.dotActive, i < currentSlide && styles.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, marginHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.slide}>
          <View style={[styles.slideTopBar, { flexDirection: rowDir }]}>
            <Text style={styles.slideTopText}>PM HOUSE ACADEMY</Text>
            <Text style={styles.slideTopNum}>{currentSlide + 1}/{slides.length}</Text>
          </View>
          <View style={styles.goldAccent} />
          <View style={styles.slideBody}>
            <Text style={[styles.slideTitle, { textAlign }]}>{slideTitle}</Text>
            <Text style={[styles.slideContent, { textAlign }]}>{slideContent}</Text>
            {keyPoints?.length > 0 && (
              <View style={styles.keyPointsContainer}>
                <View style={[styles.keyInsightHeader, { flexDirection: rowDir }]}>
                  <Ionicons name="bulb" size={16} color="#D4A843" />
                  <Text style={styles.keyInsightLabel}>KEY POINTS</Text>
                </View>
                {keyPoints.map((point: string, i: number) => (
                  <View key={i} style={[styles.keyPointRow, { flexDirection: rowDir }]}>
                    <View style={styles.bullet} />
                    <Text style={[styles.keyPointText, { textAlign }]}>{point}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.slideFooter}>
            <Text style={styles.slideFooterText}>PMHouse.org | PMI-PMO CP Prep</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.navButtons, { flexDirection: rowDir }]}>
        <TouchableOpacity testID="prev-slide-btn"
          style={[styles.navBtn, styles.navBtnSecondary, currentSlide === 0 && styles.navBtnDisabled]}
          onPress={handlePrev} disabled={currentSlide === 0}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color={currentSlide === 0 ? '#94A3B8' : '#1D4ED8'} />
          <Text style={[styles.navBtnSecondaryText, currentSlide === 0 && { color: '#94A3B8' }]}>{t('السابق', 'Previous')}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="next-slide-btn" style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>{currentSlide === slides.length - 1 ? t('الاختبار القصير', 'Quiz') : t('التالي', 'Next')}</Text>
          <Ionicons name={currentSlide === slides.length - 1 ? 'help-circle' : (isRTL ? 'arrow-back' : 'arrow-forward')} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0', gap: 16 },
  backFallback: { backgroundColor: '#1B365D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backFallbackText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topBar: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  topBtn: { padding: 8, backgroundColor: '#E8E8E4', borderRadius: 10 },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#1B365D' },
  topSub: { fontSize: 12, color: '#666', marginTop: 2 },
  audioBar: { alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 12, borderRadius: 10, backgroundColor: '#1B365D' },
  audioBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4A843', alignItems: 'center', justifyContent: 'center' },
  audioBtnActive: { backgroundColor: '#EA6A0B' },
  audioInfo: { flex: 1 },
  audioLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  speedBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  speedBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  dots: { justifyContent: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D0CC' },
  dotActive: { backgroundColor: '#1B365D', width: 24 },
  dotDone: { backgroundColor: '#D4A843' },
  slide: { backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0DC' },
  slideBody: { paddingBottom: 8 },
  slideTopBar: { backgroundColor: '#1B365D', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between', alignItems: 'center' },
  slideTopText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  slideTopNum: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  goldAccent: { height: 3, backgroundColor: '#D4A843' },
  slideTitle: { fontSize: 20, fontWeight: '700', color: '#1B365D', paddingHorizontal: 20, paddingTop: 20, marginBottom: 12, lineHeight: 30 },
  slideContent: { fontSize: 15, color: '#333', lineHeight: 24, paddingHorizontal: 20, marginBottom: 16 },
  keyPointsContainer: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F8F8F5', padding: 16, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#D4A843' },
  keyInsightHeader: { alignItems: 'center', gap: 6, marginBottom: 10 },
  keyInsightLabel: { fontSize: 11, fontWeight: '800', color: '#1B365D', letterSpacing: 2 },
  keyPointRow: { alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1B365D', marginTop: 6 },
  keyPointText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 22 },
  slideFooter: { borderTopWidth: 1, borderTopColor: '#E0E0DC', paddingVertical: 8, paddingHorizontal: 16, marginTop: 'auto' },
  slideFooterText: { fontSize: 10, color: '#999', textAlign: 'center', letterSpacing: 1 },
  navButtons: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1B365D', paddingVertical: 14, borderRadius: 8 },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navBtnSecondary: { backgroundColor: '#F0F0EC', borderWidth: 1, borderColor: '#D0D0CC' },
  navBtnSecondaryText: { color: '#1B365D', fontSize: 16, fontWeight: '700' },
  navBtnDisabled: { opacity: 0.4 },
});
