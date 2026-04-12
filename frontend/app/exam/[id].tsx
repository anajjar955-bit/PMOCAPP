import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => { fetchExam(); return () => clearInterval(timerRef.current); }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && !results) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft, results]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setQuestions(data.questions || []);
        setTimeLeft((data.exam?.time_limit_minutes || 40) * 60);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) setResults(await res.json());
    } catch (e) { console.log(e); }
    setSubmitting(false);
  };

  const confirmSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      Alert.alert('تأكيد الإرسال', `لديك ${unanswered} سؤال بدون إجابة. هل تريد الإرسال؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'إرسال', onPress: handleSubmit },
      ]);
    } else { handleSubmit(); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  if (results) {
    const passed = results.score >= (exam?.passing_score || 65);
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll}>
          <View style={styles.resultHeader}>
            <Ionicons name={passed ? 'trophy' : 'refresh'} size={48} color={passed ? '#EA580C' : '#64748B'} />
            <Text style={styles.resultTitle}>{passed ? 'مبروك! نجحت 🎉' : 'لم تنجح هذه المرة 💪'}</Text>
            <View style={[styles.scoreBig, { backgroundColor: passed ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.scoreNum, { color: passed ? '#16A34A' : '#DC2626' }]}>{results.score}%</Text>
            </View>
            <Text style={styles.resultSub}>{results.correct} صحيح من {results.total} • النجاح: {exam?.passing_score}%</Text>
          </View>

          <Text style={styles.domainTitle}>النتائج حسب المجال:</Text>
          {Object.entries(results.domain_scores || {}).map(([domain, scores]: [string, any]) => {
            const domainPct = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
            return (
              <View key={domain} style={styles.domainCard}>
                <View style={styles.domainRow}>
                  <Text style={styles.domainName}>{domain}</Text>
                  <Text style={[styles.domainScore, { color: domainPct >= 65 ? '#16A34A' : '#DC2626' }]}>{domainPct}%</Text>
                </View>
                <View style={styles.domainBar}>
                  <View style={[styles.domainBarFill, { width: `${domainPct}%`, backgroundColor: domainPct >= 65 ? '#16A34A' : '#DC2626' }]} />
                </View>
                <Text style={styles.domainDetail}>{scores.correct}/{scores.total} صحيح</Text>
              </View>
            );
          })}

          <TouchableOpacity testID="exam-done-btn" style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>العودة للاختبارات</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => Alert.alert('إنهاء الاختبار', 'سيتم فقد تقدمك. هل أنت متأكد؟', [{ text: 'إلغاء' }, { text: 'خروج', style: 'destructive', onPress: () => router.back() }])}>
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={[styles.timerBadge, timeLeft < 300 && styles.timerWarning]}>
          <Ionicons name="time" size={16} color={timeLeft < 300 ? '#DC2626' : '#1D4ED8'} />
          <Text style={[styles.timerText, timeLeft < 300 && { color: '#DC2626' }]}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={styles.qCounter}>{currentQ + 1}/{questions.length}</Text>
      </View>

      <View style={styles.qNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
          {questions.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrentQ(i)}
              style={[styles.qNavDot, i === currentQ && styles.qNavDotActive, answers[questions[i]?.id] !== undefined && styles.qNavDotAnswered]}>
              <Text style={[styles.qNavNum, i === currentQ && { color: '#fff' }]}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.questionText}>{q.scenario}</Text>
        {q.options.map((opt: string, i: number) => (
          <TouchableOpacity key={i} testID={`exam-option-${i}`}
            style={[styles.optionCard, answers[q.id] === i && styles.optionSelected]}
            onPress={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}>
            <View style={[styles.optionCircle, answers[q.id] === i && styles.optionCircleSel]}>
              {answers[q.id] === i ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.optLetter}>{String.fromCharCode(65 + i)}</Text>}
            </View>
            <Text style={[styles.optionText, answers[q.id] === i && { color: '#1D4ED8', fontWeight: '600' }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        {currentQ > 0 && (
          <TouchableOpacity style={styles.navSec} onPress={() => setCurrentQ(currentQ - 1)}>
            <Text style={styles.navSecText}>السابق</Text>
          </TouchableOpacity>
        )}
        {currentQ < questions.length - 1 ? (
          <TouchableOpacity testID="exam-next-btn" style={styles.navPri} onPress={() => setCurrentQ(currentQ + 1)}>
            <Text style={styles.navPriText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="exam-submit-btn" style={[styles.navPri, { backgroundColor: '#EA580C' }]} onPress={confirmSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navPriText}>إنهاء الاختبار</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerWarning: { backgroundColor: '#FEE2E2' },
  timerText: { fontSize: 15, fontWeight: '700', color: '#1D4ED8' },
  qCounter: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  qNav: { paddingVertical: 8 },
  qNavDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  qNavDotActive: { backgroundColor: '#1D4ED8' },
  qNavDotAnswered: { backgroundColor: '#DBEAFE' },
  qNavNum: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  questionText: { fontSize: 17, fontWeight: '600', color: '#0F172A', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  optionSelected: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  optionCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  optionCircleSel: { backgroundColor: '#1D4ED8' },
  optLetter: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  optionText: { flex: 1, fontSize: 15, color: '#374151', textAlign: 'right', lineHeight: 22 },
  bottomNav: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  navPri: { flex: 1, backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  navPriText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navSec: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EFF6FF' },
  navSecText: { color: '#1D4ED8', fontSize: 14, fontWeight: '600' },
  resultHeader: { alignItems: 'center', padding: 24 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  scoreBig: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  scoreNum: { fontSize: 36, fontWeight: '800' },
  resultSub: { fontSize: 15, color: '#64748B' },
  domainTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginHorizontal: 20, marginTop: 8, marginBottom: 12, textAlign: 'right' },
  domainCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  domainRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  domainName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  domainScore: { fontSize: 16, fontWeight: '700' },
  domainBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 8 },
  domainBarFill: { height: 6, borderRadius: 3 },
  domainDetail: { fontSize: 12, color: '#94A3B8', textAlign: 'right', marginTop: 4 },
  doneBtn: { backgroundColor: '#1D4ED8', marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
