import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useLang } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Home() {
  const { user, token, refreshUser } = useAuth();
  const { lang, toggleLang, t, isRTL } = useLang();
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
  const rowDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' as const : 'left' as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {/* Header with Language Toggle */}
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { textAlign }]}>
              {t(`مرحباً، ${user?.name || 'متدرب'} 👋`, `Welcome, ${user?.name || 'Trainee'} 👋`)}
            </Text>
            <Text style={[styles.subGreeting, { textAlign }]}>
              {t('دورة الإعداد لاختبار PMI-PMO CP', 'PMI-PMO CP Exam Prep Course')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
              <Ionicons name="language" size={16} color="#1B365D" />
              <Text style={styles.langToggleText}>{lang === 'ar' ? 'EN' : 'عربي'}</Text>
            </TouchableOpacity>
            <Image source={require('../../assets/images/pmhouse-logo.png')} style={styles.headerLogo} resizeMode="contain" />
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={[styles.progressHeader, { flexDirection: rowDir }]}>
            <Text style={styles.progressTitle}>{t('تقدمك في الدورة', 'Course Progress')}</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={[styles.progressDetail, { textAlign }]}>
            {t(
              `${progress?.completed_lessons || 0} من ${progress?.total_lessons || 25} درس مكتمل`,
              `${progress?.completed_lessons || 0} of ${progress?.total_lessons || 25} lessons completed`
            )}
          </Text>
        </View>

        {/* Subscription Status */}
        {!user?.is_paid && (
          <TouchableOpacity testID="subscribe-banner" style={[styles.subscribeBanner, { flexDirection: rowDir }]} onPress={() => router.push('/payment')}>
            <View style={[styles.bannerContent, { flexDirection: rowDir }]}>
              <Ionicons name="star" size={24} color="#EA580C" />
              <View style={[styles.bannerText, { marginHorizontal: 12 }]}>
                <Text style={[styles.bannerTitle, { textAlign }]}>{t('اشترك الآن للوصول الكامل', 'Subscribe for Full Access')}</Text>
                <Text style={[styles.bannerSub, { textAlign }]}>{t('شاهد جميع الدروس والاختبارات', 'Access all lessons and exams')}</Text>
              </View>
            </View>
            <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color="#EA580C" />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('الوصول السريع', 'Quick Access')}</Text>
        <View style={[styles.actionsGrid, { flexDirection: rowDir }]}>
          <TouchableOpacity testID="start-course-btn" style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/(tabs)/course')}>
            <Ionicons name="play-circle" size={32} color="#1D4ED8" />
            <Text style={[styles.actionTitle, { textAlign }]}>{t('متابعة الدورة', 'Continue Course')}</Text>
            <Text style={[styles.actionSub, { textAlign }]}>{t('25 درس تفاعلي', '25 interactive lessons')}</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="start-exam-btn" style={[styles.actionCard, { backgroundColor: '#FFF7ED' }]} onPress={() => router.push('/(tabs)/exams')}>
            <Ionicons name="document-text" size={32} color="#EA580C" />
            <Text style={[styles.actionTitle, { textAlign }]}>{t('الاختبارات', 'Exams')}</Text>
            <Text style={[styles.actionSub, { textAlign }]}>{t('اختباران تجريبيان', '2 mock exams')}</Text>
          </TouchableOpacity>

          {isComplete && (
            <TouchableOpacity testID="view-certificate-btn" style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]} onPress={() => router.push('/certificate')}>
              <Ionicons name="ribbon" size={32} color="#16A34A" />
              <Text style={[styles.actionTitle, { textAlign }]}>{t('شهادة الإتمام', 'Certificate')}</Text>
              <Text style={[styles.actionSub, { textAlign }]}>{t('حمّل شهادتك', 'Download certificate')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Course Info */}
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('عن الدورة', 'About the Course')}</Text>
        <View style={[styles.infoCard, { flexDirection: rowDir }]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{t('3 ساعات', '3 Hours')}</Text>
            <Text style={styles.infoLabel}>{t('مدة الدورة', 'Duration')}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{t('6 وحدات', '6 Modules')}</Text>
            <Text style={styles.infoLabel}>{t('المجالات', 'Domains')}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{t('90+ سؤال', '90+ Questions')}</Text>
            <Text style={styles.infoLabel}>{t('أسئلة تدريبية', 'Practice Q&A')}</Text>
          </View>
        </View>

        {/* Exam Attempts */}
        {progress?.exam_attempts?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { textAlign }]}>{t('آخر محاولات الاختبارات', 'Recent Exam Attempts')}</Text>
            {progress.exam_attempts.slice(-3).reverse().map((a: any, i: number) => (
              <View key={i} style={[styles.attemptCard, { flexDirection: rowDir }]}>
                <View style={styles.attemptInfo}>
                  <Text style={[styles.attemptName, { textAlign }]}>
                    {t(a.exam_id === 'exam1' ? 'الاختبار الأول' : 'الاختبار الثاني',
                       a.exam_id === 'exam1' ? 'Practice Exam 1' : 'Practice Exam 2')}
                  </Text>
                  <Text style={[styles.attemptDate, { textAlign }]}>{a.date?.split('T')[0]}</Text>
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
  header: { justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subGreeting: { fontSize: 14, color: '#64748B', marginTop: 4 },
  headerLogo: { width: 50, height: 50 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  langToggleText: { fontSize: 13, fontWeight: '700', color: '#1B365D' },
  progressCard: { backgroundColor: '#1D4ED8', marginHorizontal: 20, borderRadius: 16, padding: 20, marginTop: 12 },
  progressHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  progressPct: { fontSize: 24, fontWeight: '800', color: '#fff' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  progressDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  subscribeBanner: { alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF7ED', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FFEDD5' },
  bannerContent: { alignItems: 'center', gap: 12, flex: 1 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  bannerSub: { fontSize: 13, color: '#64748B' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  actionsGrid: { flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  actionCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 14, alignItems: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 10 },
  actionSub: { fontSize: 12, color: '#64748B', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  infoRow: { flex: 1, alignItems: 'center' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  infoLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  infoDivider: { width: 1, backgroundColor: '#E2E8F0' },
  attemptCard: { alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  attemptInfo: { flex: 1 },
  attemptName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  attemptDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scoreBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  scoreText: { fontSize: 16, fontWeight: '700' },
});
