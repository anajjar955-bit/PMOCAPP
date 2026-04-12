import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

export default function LessonViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { fetchLesson(); }, [id]);

  const fetchLesson = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/course/lessons/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLesson(data.lesson);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const markComplete = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/course/lessons/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { console.log(e); }
  };

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (!lesson) return;
    if (currentSlide < lesson.slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      markComplete();
      router.push(`/quiz/${id}`);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  if (!lesson) return <View style={styles.loader}><Text style={{ fontSize: 16, color: '#64748B' }}>الدرس غير متاح</Text></View>;

  const slides = lesson.slides || [];

  const renderSlide = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.slide, { width: width - 32 }]}>
      <View style={styles.slideHeader}>
        <Text style={styles.slideNumber}>شريحة {index + 1} من {slides.length}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideContent}>{item.content}</Text>
      {item.key_points?.length > 0 && (
        <View style={styles.keyPointsContainer}>
          <Text style={styles.keyPointsTitle}>النقاط الرئيسية:</Text>
          {item.key_points.map((point: string, i: number) => (
            <View key={i} style={styles.keyPointRow}>
              <View style={styles.bullet}>
                <Text style={styles.bulletText}>{i + 1}</Text>
              </View>
              <Text style={styles.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity testID="lesson-back-btn" onPress={() => router.back()} style={styles.topBtn}>
          <Ionicons name="arrow-forward" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.topSub}>{lesson.duration_minutes} دقائق</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Dots */}
      <View style={styles.dots}>
        {slides.map((_: any, i: number) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View style={[styles.dot, i === currentSlide && styles.dotActive, i < currentSlide && styles.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setCurrentSlide(idx);
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={width - 32}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: width - 32, offset: (width - 32) * index, index })}
      />

      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          testID="prev-slide-btn"
          style={[styles.navBtn, styles.navBtnSecondary, currentSlide === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={currentSlide === 0}
        >
          <Ionicons name="arrow-forward" size={18} color={currentSlide === 0 ? '#94A3B8' : '#1D4ED8'} />
          <Text style={[styles.navBtnSecondaryText, currentSlide === 0 && { color: '#94A3B8' }]}>السابق</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="next-slide-btn" style={styles.navBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>
            {currentSlide === slides.length - 1 ? 'الاختبار القصير' : 'التالي'}
          </Text>
          <Ionicons name={currentSlide === slides.length - 1 ? 'help-circle' : 'arrow-back'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  topBtn: { padding: 8 },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  topSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dots: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: '#1D4ED8', width: 24 },
  dotDone: { backgroundColor: '#16A34A' },
  slide: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginRight: 0, borderWidth: 1, borderColor: '#E2E8F0', flex: 1 },
  slideHeader: { marginBottom: 16 },
  slideNumber: { fontSize: 13, color: '#94A3B8', textAlign: 'right' },
  slideTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'right', marginBottom: 16, lineHeight: 32 },
  slideContent: { fontSize: 16, color: '#475569', textAlign: 'right', lineHeight: 26, marginBottom: 20 },
  keyPointsContainer: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  keyPointsTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  keyPointRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bulletText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  keyPointText: { flex: 1, fontSize: 14, color: '#374151', textAlign: 'right', lineHeight: 22 },
  navButtons: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 12 },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navBtnSecondary: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  navBtnSecondaryText: { color: '#1D4ED8', fontSize: 16, fontWeight: '700' },
  navBtnDisabled: { opacity: 0.5 },
});
