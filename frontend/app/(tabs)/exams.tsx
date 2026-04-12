import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Exams() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExams(); }, [token]);

  const fetchExams = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/exams`, { headers });
      const data = await res.json();
      setExams(data.exams || []);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الاختبارات التجريبية</Text>
        <Text style={styles.headerSub}>اختبر معلوماتك قبل الاختبار الحقيقي</Text>
      </View>
      <ScrollView style={styles.scroll}>
        {!user?.is_paid && (
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed" size={24} color="#EA580C" />
            <Text style={styles.lockedText}>اشترك للوصول للاختبارات التجريبية</Text>
            <TouchableOpacity testID="subscribe-from-exams" style={styles.lockedBtn} onPress={() => router.push('/payment')}>
              <Text style={styles.lockedBtnText}>اشترك الآن</Text>
            </TouchableOpacity>
          </View>
        )}

        {exams.map((exam) => (
          <View key={exam.id} style={styles.examCard}>
            <View style={styles.examHeader}>
              <View style={styles.examIconContainer}>
                <Ionicons name="document-text" size={28} color="#1D4ED8" />
              </View>
              <View style={styles.examInfo}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <Text style={styles.examDesc}>{exam.description}</Text>
              </View>
            </View>

            <View style={styles.examStats}>
              <View style={styles.statItem}>
                <Ionicons name="help-circle-outline" size={16} color="#64748B" />
                <Text style={styles.statText}>{exam.question_count} سؤال</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.statText}>{exam.time_limit_minutes} دقيقة</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#64748B" />
                <Text style={styles.statText}>النجاح: {exam.passing_score}%</Text>
              </View>
            </View>

            {exam.attempts?.length > 0 && (
              <View style={styles.attemptsSection}>
                <Text style={styles.attemptsTitle}>المحاولات السابقة:</Text>
                {exam.attempts.slice(0, 3).map((attempt: any, i: number) => (
                  <View key={i} style={styles.attemptRow}>
                    <Text style={styles.attemptDate}>{attempt.created_at?.split('T')[0]}</Text>
                    <View style={[styles.attemptScore, { backgroundColor: attempt.score >= exam.passing_score ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: attempt.score >= exam.passing_score ? '#16A34A' : '#DC2626' }}>
                        {attempt.score}% ({attempt.correct}/{attempt.total})
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              testID={`start-exam-${exam.id}`}
              style={[styles.startBtn, !exam.is_accessible && styles.startBtnDisabled]}
              onPress={() => {
                if (exam.is_accessible) router.push(`/exam/${exam.id}`);
                else router.push('/payment');
              }}
            >
              <Ionicons name={exam.is_accessible ? "play" : "lock-closed"} size={18} color="#fff" />
              <Text style={styles.startBtnText}>
                {exam.is_accessible ? (exam.attempts?.length > 0 ? 'إعادة الاختبار' : 'ابدأ الاختبار') : 'اشترك للبدء'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'right' },
  headerSub: { fontSize: 14, color: '#64748B', textAlign: 'right', marginTop: 4 },
  lockedBanner: { backgroundColor: '#FFF7ED', marginHorizontal: 16, padding: 20, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FFEDD5', marginBottom: 12 },
  lockedText: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginTop: 8, textAlign: 'center' },
  lockedBtn: { backgroundColor: '#EA580C', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  lockedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  examCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  examHeader: { flexDirection: 'row-reverse', gap: 14 },
  examIconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  examDesc: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 4, lineHeight: 20 },
  examStats: { flexDirection: 'row-reverse', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#64748B' },
  attemptsSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  attemptsTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', textAlign: 'right', marginBottom: 8 },
  attemptRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  attemptDate: { fontSize: 13, color: '#64748B' },
  attemptScore: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  startBtn: { backgroundColor: '#1D4ED8', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  startBtnDisabled: { backgroundColor: '#94A3B8' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
