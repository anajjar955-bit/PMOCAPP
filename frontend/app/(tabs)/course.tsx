import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const ICON_MAP: Record<string, string> = {
  'building-2': 'business', 'target': 'navigate', 'layout': 'grid',
  'settings': 'settings', 'trending-up': 'trending-up', 'users': 'people',
};

export default function Course() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => { fetchModules(); }, [token]);

  const fetchModules = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/course/modules`, { headers });
      const data = await res.json();
      setModules(data.modules || []);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const fetchLessons = async (moduleId: string) => {
    if (selectedModule === moduleId) { setSelectedModule(null); return; }
    setSelectedModule(moduleId);
    setLessonsLoading(true);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BACKEND_URL}/api/course/modules/${moduleId}/lessons`, { headers });
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (e) { console.log(e); }
    setLessonsLoading(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>محتوى الدورة</Text>
        <Text style={styles.headerSub}>6 وحدات • 25 درس • 3 ساعات</Text>
      </View>
      <ScrollView style={styles.scroll}>
        {modules.map((mod) => {
          const isOpen = selectedModule === mod.id;
          const pct = mod.lesson_count > 0 ? Math.round((mod.completed_lessons / mod.lesson_count) * 100) : 0;
          return (
            <View key={mod.id}>
              <TouchableOpacity
                testID={`module-${mod.id}`}
                style={[styles.moduleCard, isOpen && styles.moduleCardActive]}
                onPress={() => fetchLessons(mod.id)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                  <Ionicons name={(ICON_MAP[mod.icon] || 'book') as any} size={22} color={mod.color} />
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <View style={styles.moduleStats}>
                    <Text style={styles.moduleStat}>{mod.lesson_count} دروس</Text>
                    <Text style={styles.moduleStat}>•</Text>
                    <Text style={styles.moduleStat}>{mod.exam_weight}% من الاختبار</Text>
                    <Text style={styles.moduleStat}>•</Text>
                    <Text style={styles.moduleStat}>{mod.duration_minutes} دقيقة</Text>
                  </View>
                  {pct > 0 && (
                    <View style={styles.miniProgressBg}>
                      <View style={[styles.miniProgressFill, { width: `${pct}%`, backgroundColor: mod.color }]} />
                    </View>
                  )}
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.lessonsContainer}>
                  {lessonsLoading ? (
                    <ActivityIndicator style={{ padding: 16 }} color="#1D4ED8" />
                  ) : lessons.map((lesson, idx) => (
                    <TouchableOpacity
                      key={lesson.id}
                      testID={`lesson-${lesson.id}`}
                      style={styles.lessonRow}
                      onPress={() => {
                        if (lesson.is_accessible) router.push(`/lesson/${lesson.id}`);
                        else router.push('/payment');
                      }}
                    >
                      <View style={styles.lessonLeft}>
                        <View style={[
                          styles.lessonNumber,
                          lesson.is_completed && styles.lessonNumberDone,
                          !lesson.is_accessible && styles.lessonNumberLocked
                        ]}>
                          {lesson.is_completed ? (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          ) : !lesson.is_accessible ? (
                            <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                          ) : (
                            <Text style={styles.lessonNumText}>{idx + 1}</Text>
                          )}
                        </View>
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, !lesson.is_accessible && styles.lessonLocked]}>
                            {lesson.title}
                          </Text>
                          <View style={styles.lessonMeta}>
                            <Text style={styles.lessonDuration}>{lesson.duration_minutes} دقائق</Text>
                            {lesson.is_demo && <View style={styles.demoBadge}><Text style={styles.demoText}>مجاني</Text></View>}
                            {lesson.quiz_score != null && (
                              <View style={[styles.quizBadge, { backgroundColor: lesson.quiz_score >= 65 ? '#DCFCE7' : '#FEE2E2' }]}>
                                <Text style={{ fontSize: 11, color: lesson.quiz_score >= 65 ? '#16A34A' : '#DC2626', fontWeight: '600' }}>
                                  اختبار: {lesson.quiz_score}%
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <Ionicons name="arrow-back" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
  moduleCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  moduleCardActive: { borderColor: '#1D4ED8', borderWidth: 2 },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  moduleStats: { flexDirection: 'row-reverse', gap: 6, marginTop: 4 },
  moduleStat: { fontSize: 12, color: '#64748B' },
  miniProgressBg: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 8 },
  miniProgressFill: { height: 4, borderRadius: 2 },
  lessonsContainer: { marginHorizontal: 16, backgroundColor: '#fff', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, borderWidth: 1, borderTopWidth: 0, borderColor: '#E2E8F0' },
  lessonRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  lessonLeft: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 12 },
  lessonNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  lessonNumberDone: { backgroundColor: '#16A34A' },
  lessonNumberLocked: { backgroundColor: '#F1F5F9' },
  lessonNumText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  lessonLocked: { color: '#94A3B8' },
  lessonMeta: { flexDirection: 'row-reverse', gap: 8, marginTop: 4, alignItems: 'center' },
  lessonDuration: { fontSize: 12, color: '#94A3B8' },
  demoBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  demoText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  quizBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
});
