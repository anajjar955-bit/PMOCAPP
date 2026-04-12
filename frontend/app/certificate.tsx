import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Certificate() {
  const { token } = useAuth();
  const router = useRouter();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
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

  const generateCertificateHTML = () => {
    if (!certificate) return '';
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: landscape; margin: 0; }
        body { margin: 0; padding: 40px; font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; }
        .cert { width: 900px; background: white; border: 4px solid #1D4ED8; border-radius: 16px; padding: 50px; text-align: center; position: relative; }
        .cert::before { content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 2px solid #EA580C; border-radius: 12px; pointer-events: none; }
        .logo-text { color: #EA580C; font-size: 20px; font-weight: bold; margin-top: 15px; }
        .title { color: #1D4ED8; font-size: 28px; font-weight: 800; letter-spacing: 3px; margin: 20px 0 5px; }
        .title-ar { color: #475569; font-size: 18px; margin-bottom: 15px; }
        .divider { width: 60%; margin: 15px auto; height: 3px; background: linear-gradient(90deg, transparent, #EA580C, transparent); }
        .granted { color: #94A3B8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 15px 0 10px; }
        .name { font-size: 36px; font-weight: 800; color: #0F172A; margin: 10px 0 20px; }
        .course-ar { font-size: 18px; font-weight: 600; color: #0F172A; }
        .course-en { font-size: 14px; color: #64748B; margin-top: 5px; }
        .footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; }
        .footer-item { text-align: center; }
        .footer-label { font-size: 11px; color: #94A3B8; }
        .footer-value { font-size: 14px; font-weight: 600; color: #0F172A; margin-top: 4px; }
        .pm-logo { width: 70px; height: 70px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="cert">
        <div style="text-align:center">
          <div style="width:70px;height:70px;margin:0 auto;border:3px solid #EA580C;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;">
            <span style="color:#1D4ED8;font-weight:900;font-size:14px;">PM<br>HOUSE</span>
          </div>
        </div>
        <div class="logo-text">PM House Academy</div>
        <div class="title">CERTIFICATE OF ACHIEVEMENT</div>
        <div class="title-ar">شهادة إتمام الدورة</div>
        <div class="divider"></div>
        <div class="granted">IS HEREBY GRANTED TO</div>
        <div class="name">${certificate.name}</div>
        <div class="granted">FOR COMPLETING</div>
        <div class="course-ar">${certificate.course_name_ar}</div>
        <div class="course-en">${certificate.course_name}</div>
        <div class="footer">
          <div class="footer-item">
            <div class="footer-label">رقم الشهادة</div>
            <div class="footer-value">${certificate.certificate_id}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">الجهة المانحة</div>
            <div class="footer-value">${certificate.issuer}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">التاريخ</div>
            <div class="footer-value">${certificate.issue_date}</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
  };

  const shareCertificate = async () => {
    if (!certificate) return;
    setSharing(true);
    try {
      const html = generateCertificateHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        width: 1000,
        height: 700,
      });

      if (Platform.OS === 'web') {
        // On web, trigger download
        const link = document.createElement('a');
        link.href = uri;
        link.download = `PMHouse_Certificate_${certificate.name}.pdf`;
        link.click();
      } else {
        // On mobile, share
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'مشاركة شهادة PM House',
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (e) {
      console.log('Share error:', e);
      // Fallback: try print
      try {
        await Print.printAsync({ html: generateCertificateHTML() });
      } catch (e2) {
        console.log('Print fallback error:', e2);
      }
    }
    setSharing(false);
  };

  const printCertificate = async () => {
    if (!certificate) return;
    try {
      await Print.printAsync({ html: generateCertificateHTML() });
    } catch (e) {
      console.log('Print error:', e);
    }
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

      <ScrollView contentContainerStyle={styles.certScroll}>
        <View style={styles.certCard}>
          <View style={styles.certBorder}>
            <View style={styles.certHeader}>
              <Image source={require('../assets/images/pmhouse-logo.png')} style={styles.certLogo} resizeMode="contain" />
              <Text style={styles.certOrgName}>PM House Academy</Text>
            </View>
            <Text style={styles.certTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
            <Text style={styles.certTitleAr}>شهادة إتمام الدورة</Text>
            <View style={styles.certDivider} />
            <Text style={styles.certGranted}>IS HEREBY GRANTED TO</Text>
            <Text style={styles.certName}>{certificate?.name}</Text>
            <Text style={styles.certFor}>FOR COMPLETING</Text>
            <Text style={styles.certCourse}>{certificate?.course_name_ar}</Text>
            <Text style={styles.certCourseEn}>{certificate?.course_name}</Text>
            <View style={styles.certFooter}>
              <View style={styles.certFooterItem}>
                <Text style={styles.certFooterLabel}>التاريخ</Text>
                <Text style={styles.certFooterValue}>{certificate?.issue_date}</Text>
              </View>
              <View style={styles.certFooterItem}>
                <Text style={styles.certFooterLabel}>الجهة</Text>
                <Text style={styles.certFooterValue}>{certificate?.issuer}</Text>
              </View>
              <View style={styles.certFooterItem}>
                <Text style={styles.certFooterLabel}>رقم الشهادة</Text>
                <Text style={styles.certFooterValue}>{certificate?.certificate_id}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity testID="download-cert-btn" style={styles.downloadBtn} onPress={shareCertificate} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="download-outline" size={22} color="#fff" />
                <Text style={styles.downloadBtnText}>تحميل الشهادة PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity testID="print-cert-btn" style={styles.printBtn} onPress={printCertificate}>
            <Ionicons name="print-outline" size={22} color="#1D4ED8" />
            <Text style={styles.printBtnText}>طباعة الشهادة</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  certScroll: { flexGrow: 1, padding: 16 },
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
  certFooterItem: { alignItems: 'center', flex: 1 },
  certFooterLabel: { fontSize: 11, color: '#94A3B8' },
  certFooterValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 4 },
  actionButtons: { gap: 12, marginTop: 20 },
  downloadBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1D4ED8', paddingVertical: 16, borderRadius: 14 },
  downloadBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  printBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#DBEAFE' },
  printBtnText: { color: '#1D4ED8', fontSize: 16, fontWeight: '700' },
});
