import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Home() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (e) { console.log('Progress fetch failed', e); }
    setLoading(false);
  };

  useEffect(() => { fetchProgress(); }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    await fetchProgress();
    setRefreshing(false);
  }, [token]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  const pct = progress?.progress_percentage || 0;
  const isComplete = progress?.is_course_complete || false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRight}>
            <Text style={styles.greeting}>مرحباً، {user?.name || 'متدرب'} 👋</Text>
            <Text style={styles.subGreeting}>دورة الإعداد لاختبار PMI-PMO CP</Text>
          </View>
          <Image source={require('../../assets/images/pmhouse-logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>تقدمك في الدورة</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressDetail}>
            {progress?.completed_lessons || 0} من {progress?.total_lessons || 25} درس مكتمل
          </Text>
        </View>

        {/* Subscription Status */}
        {!user?.is_paid && (
          <TouchableOpacity testID="subscribe-banner" style={styles.subscribeBanner} onPress={() => router.push('/payment')}>
            <View style={styles.bannerContent}>
              <Ionicons name="star" size={24} color="#EA580C" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>اشترك الآن للوصول الكامل</Text>
                <Text style={styles.bannerSub}>شاهد جميع الدروس والاختبارات</Text>
              </View>
            </View>
            <Ionicons name="arrow-back" size={20} color="#EA580C" />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>الوصول السريع</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity testID="start-course-btn" style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/(tabs)/course')}>
            <Ionicons name="play-circle" size={32} color="#1D4ED8" />
            <Text style={styles.actionTitle}>متابعة الدورة</Text>
            <Text style={styles.actionSub}>25 درس تفاعلي</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="start-exam-btn" style={[styles.actionCard, { backgroundColor: '#FFF7ED' }]} onPress={() => router.push('/(tabs)/exams')}>
            <Ionicons name="document-text" size={32} color="#EA580C" />
            <Text style={styles.actionTitle}>الاختبارات</Text>
            <Text style={styles.actionSub}>اختباران تجريبيان</Text>
          </TouchableOpacity>

          {isComplete && (
            <TouchableOpacity testID="view-certificate-btn" style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]} onPress={() => router.push('/certificate')}>
              <Ionicons name="ribbon" size={32} color="#16A34A" />
              <Text style={styles.actionTitle}>شهادة الإتمام</Text>
              <Text style={styles.actionSub}>حمّل شهادتك</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Course Info */}
        <Text style={styles.sectionTitle}>عن الدورة</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>3 ساعات</Text>
            <Text style={styles.infoLabel}>مدة الدورة</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>6 وحدات</Text>
            <Text style={styles.infoLabel}>المجالات</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>90+ سؤال</Text>
            <Text style={styles.infoLabel}>أسئلة تدريبية</Text>
          </View>
        </View>

        {/* Exam Attempts */}
        {progress?.exam_attempts?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>آخر محاولات الاختبارات</Text>
            {progress.exam_attempts.slice(-3).reverse().map((a: any, i: number) => (
              <View key={i} style={styles.attemptCard}>
                <View style={styles.attemptInfo}>
                  <Text style={styles.attemptName}>{a.exam_id === 'exam1' ? 'الاختبار الأول' : 'الاختبار الثاني'}</Text>
                  <Text style={styles.attemptDate}>{a.date?.split('T')[0]}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: a.score >= 65 ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Text style={[styles.scoreText, { color: a.score >= 65 ? '#16A34A' : '#DC2626' }]}>{a.score}%</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  headerRight: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'right' },
  subGreeting: { fontSize: 14, color: '#64748B', textAlign: 'right', marginTop: 4 },
  headerLogo: { width: 50, height: 50, marginLeft: 12 },
  progressCard: { backgroundColor: '#1D4ED8', marginHorizontal: 20, borderRadius: 16, padding: 20, marginTop: 12 },
  progressHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  progressPct: { fontSize: 24, fontWeight: '800', color: '#fff' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  progressDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'right' },
  subscribeBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF7ED', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FFEDD5' },
  bannerContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  bannerSub: { fontSize: 13, color: '#64748B', textAlign: 'right' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginHorizontal: 20, marginTop: 24, marginBottom: 12, textAlign: 'right' },
  actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  actionCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 14, alignItems: 'flex-end' },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 10, textAlign: 'right' },
  actionSub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'right' },
  infoCard: { flexDirection: 'row-reverse', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  infoRow: { flex: 1, alignItems: 'center' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  infoLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  infoDivider: { width: 1, backgroundColor: '#E2E8F0' },
  attemptCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  attemptInfo: { flex: 1 },
  attemptName: { fontSize: 14, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  attemptDate: { fontSize: 12, color: '#94A3B8', textAlign: 'right', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  scoreText: { fontSize: 16, fontWeight: '700' },
});
