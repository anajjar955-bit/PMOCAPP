import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Certificate() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchCertificate(); }, []);

  const fetchCertificate = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/certificate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificate(data.certificate);
      } else {
        const data = await res.json();
        setError(data.detail || 'الدورة غير مكتملة');
      }
    } catch (e) { setError('خطأ في تحميل الشهادة'); }
    setLoading(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#1D4ED8" /></View>;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity testID="cert-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#94A3B8" />
          <Text style={styles.errorTitle}>الشهادة غير متاحة بعد</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.goToCourseBtn} onPress={() => router.push('/(tabs)/course')}>
            <Text style={styles.goToCourseBtnText}>أكمل الدورة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity testID="cert-back-btn" onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-forward" size={24} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.certContainer}>
        <View style={styles.certCard}>
          {/* Certificate Border */}
          <View style={styles.certBorder}>
            {/* Header */}
            <View style={styles.certHeader}>
              <Image source={require('../assets/images/pmhouse-logo.png')} style={styles.certLogo} resizeMode="contain" />
              <Text style={styles.certOrgName}>PM House Academy</Text>
            </View>

            {/* Title */}
            <Text style={styles.certTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
            <Text style={styles.certTitleAr}>شهادة إتمام الدورة</Text>

            {/* Divider */}
            <View style={styles.certDivider} />

            {/* Granted To */}
            <Text style={styles.certGranted}>IS HEREBY GRANTED TO</Text>
            <Text style={styles.certName}>{certificate?.name}</Text>

            {/* Course */}
            <Text style={styles.certFor}>FOR COMPLETING</Text>
            <Text style={styles.certCourse}>{certificate?.course_name_ar}</Text>
            <Text style={styles.certCourseEn}>{certificate?.course_name}</Text>

            {/* Date */}
            <View style={styles.certFooter}>
              <View style={styles.certFooterItem}>
                <Text style={styles.certFooterLabel}>التاريخ</Text>
                <Text style={styles.certFooterValue}>{certificate?.issue_date}</Text>
              </View>
              <View style={styles.certFooterItem}>
                <Text style={styles.certFooterLabel}>رقم الشهادة</Text>
                <Text style={styles.certFooterValue}>{certificate?.certificate_id}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          testID="share-cert-btn"
          style={styles.shareBtn}
          onPress={() => Alert.alert('مشاركة', 'قم بأخذ لقطة شاشة لمشاركة الشهادة')}
        >
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>مشاركة الشهادة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  backBtn: { padding: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  errorText: { fontSize: 15, color: '#64748B', marginTop: 8, textAlign: 'center' },
  goToCourseBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  goToCourseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  certContainer: { flex: 1, padding: 16, justifyContent: 'center' },
  certCard: { backgroundColor: '#fff', borderRadius: 16, padding: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  certBorder: { borderWidth: 3, borderColor: '#1D4ED8', borderRadius: 14, padding: 24, alignItems: 'center' },
  certHeader: { alignItems: 'center', marginBottom: 16 },
  certLogo: { width: 60, height: 60, marginBottom: 8 },
  certOrgName: { fontSize: 16, fontWeight: '700', color: '#EA580C' },
  certTitle: { fontSize: 18, fontWeight: '800', color: '#1D4ED8', letterSpacing: 2, marginBottom: 4 },
  certTitleAr: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 8 },
  certDivider: { width: '80%', height: 2, backgroundColor: '#EA580C', marginVertical: 12 },
  certGranted: { fontSize: 11, color: '#94A3B8', letterSpacing: 1, marginBottom: 8 },
  certName: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  certFor: { fontSize: 11, color: '#94A3B8', letterSpacing: 1, marginBottom: 8 },
  certCourse: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  certCourseEn: { fontSize: 14, color: '#64748B', marginTop: 4 },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  certFooterItem: { alignItems: 'center' },
  certFooterLabel: { fontSize: 11, color: '#94A3B8' },
  certFooterValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 4 },
  shareBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
