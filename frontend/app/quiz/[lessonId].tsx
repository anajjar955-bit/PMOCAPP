import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Quiz() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchQuiz(); }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/course/lessons/${lessonId}/quiz`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const selectAnswer = (qId: string, optionIndex: number) => {
    if (results) return;
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/course/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) { console.log(e); }
    setSubmitting(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
          <Text style={styles.emptyText}>لا توجد أسئلة لهذا الدرس</Text>
          <TouchableOpacity testID="quiz-back" style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (results) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll}>
          <View style={styles.resultHeader}>
            <View style={[styles.scoreCircle, { backgroundColor: results.score >= 65 ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.scoreValue, { color: results.score >= 65 ? '#16A34A' : '#DC2626' }]}>{results.score}%</Text>
            </View>
            <Text style={styles.resultTitle}>{results.score >= 65 ? 'أحسنت! 🎉' : 'حاول مرة أخرى 💪'}</Text>
            <Text style={styles.resultSub}>{results.correct} إجابة صحيحة من {results.total}</Text>
          </View>

          {questions.map((q, i) => {
            const r = results.results[q.id];
            return (
              <View key={q.id} style={styles.resultCard}>
                <View style={styles.resultQHeader}>
                  <Ionicons name={r?.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={r?.correct ? '#16A34A' : '#DC2626'} />
                  <Text style={styles.resultQNum}>سؤال {i + 1}</Text>
                </View>
                <Text style={styles.resultQText}>{q.scenario}</Text>
                {q.options.map((opt: string, oi: number) => (
                  <View key={oi} style={[
                    styles.resultOption,
                    oi === r?.correct_answer && styles.resultOptionCorrect,
                    oi === r?.user_answer && !r?.correct && styles.resultOptionWrong,
                  ]}>
                    <Text style={styles.resultOptionText}>{opt}</Text>
                    {oi === r?.correct_answer && <Ionicons name="checkmark" size={16} color="#16A34A" />}
                  </View>
                ))}
                {r?.explanation && <Text style={styles.explanation}>💡 {r.explanation}</Text>}
              </View>
            );
          })}

          <TouchableOpacity testID="quiz-done-btn" style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>العودة للدورة</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[currentQ];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>اختبار قصير</Text>
        <Text style={styles.topCounter}>{currentQ + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        {q.type === 'mcq' && <View style={styles.typeBadge}><Text style={styles.typeText}>اختيار من متعدد</Text></View>}
        {q.type === 'tf' && <View style={[styles.typeBadge, { backgroundColor: '#FFF7ED' }]}><Text style={[styles.typeText, { color: '#EA580C' }]}>صح أو خطأ</Text></View>}

        <Text style={styles.questionText}>{q.scenario}</Text>

        {q.options.map((opt: string, i: number) => (
          <TouchableOpacity
            key={i}
            testID={`option-${i}`}
            style={[styles.optionCard, answers[q.id] === i && styles.optionSelected]}
            onPress={() => selectAnswer(q.id, i)}
          >
            <View style={[styles.optionCircle, answers[q.id] === i && styles.optionCircleSelected]}>
              {answers[q.id] === i ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>}
            </View>
            <Text style={[styles.optionText, answers[q.id] === i && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.navButtons}>
        {currentQ > 0 && (
          <TouchableOpacity style={styles.navBtnSec} onPress={() => setCurrentQ(currentQ - 1)}>
            <Ionicons name="arrow-forward" size={18} color="#1D4ED8" />
            <Text style={styles.navBtnSecText}>السابق</Text>
          </TouchableOpacity>
        )}
        {currentQ < questions.length - 1 ? (
          <TouchableOpacity
            testID="next-question-btn"
            style={[styles.navBtnPri, !answers[q.id] && answers[q.id] !== 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentQ(currentQ + 1)}
            disabled={answers[q.id] === undefined}
          >
            <Text style={styles.navBtnPriText}>التالي</Text>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="submit-quiz-btn"
            style={[styles.navBtnPri, { backgroundColor: '#16A34A' }, !allAnswered && styles.navBtnDisabled]}
            onPress={submitQuiz}
            disabled={!allAnswered || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navBtnPriText}>إرسال الإجابات</Text>}
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: '#64748B' },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topBtn: { padding: 4 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  topCounter: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  progressFill: { height: 4, backgroundColor: '#1D4ED8', borderRadius: 2 },
  typeBadge: { alignSelf: 'flex-end', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  typeText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  questionText: { fontSize: 18, fontWeight: '600', color: '#0F172A', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  optionSelected: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  optionCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected: { backgroundColor: '#1D4ED8' },
  optionLetter: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  optionText: { flex: 1, fontSize: 15, color: '#374151', textAlign: 'right', lineHeight: 22 },
  optionTextSelected: { color: '#1D4ED8', fontWeight: '600' },
  navButtons: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  navBtnPri: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 12 },
  navBtnPriText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navBtnSec: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EFF6FF' },
  navBtnSecText: { color: '#1D4ED8', fontSize: 14, fontWeight: '600' },
  navBtnDisabled: { opacity: 0.5 },
  resultHeader: { alignItems: 'center', padding: 24 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scoreValue: { fontSize: 32, fontWeight: '800' },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  resultSub: { fontSize: 15, color: '#64748B', marginTop: 4 },
  resultCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  resultQHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  resultQNum: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  resultQText: { fontSize: 14, color: '#475569', textAlign: 'right', lineHeight: 22, marginBottom: 12 },
  resultOption: { padding: 10, borderRadius: 8, marginBottom: 4, backgroundColor: '#F8FAFC' },
  resultOptionCorrect: { backgroundColor: '#DCFCE7' },
  resultOptionWrong: { backgroundColor: '#FEE2E2' },
  resultOptionText: { fontSize: 13, color: '#374151', textAlign: 'right' },
  explanation: { fontSize: 13, color: '#1D4ED8', textAlign: 'right', marginTop: 8, fontStyle: 'italic' },
  doneBtn: { backgroundColor: '#1D4ED8', marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
