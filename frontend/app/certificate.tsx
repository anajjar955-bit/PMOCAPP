import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useLang } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import certImages from '../assets/cert_images.json';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const PMI_LOGO_B64 = certImages.logo;
const PMI_SEAL_B64 = certImages.seal;

export default function Certificate() {
  const { token } = useAuth();
  const { t, isRTL } = useLang();
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
        setError(data.detail || 'Course not completed');
      }
    } catch (e) { setError('Failed to load certificate'); }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const generateCertificateHTML = () => {
    if (!certificate) return '';
    const fDate = formatDate(certificate.issue_date);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page { size: 11in 8.5in landscape; margin: 0; }
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', 'Segoe UI', 'Aptos', Arial, sans-serif; background: #e8e8e8; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.cert-page { width: 960px; height: 680px; background: #FFFFFF; position: relative; overflow: hidden; }
.outer-border { position: absolute; top: 14px; left: 14px; right: 14px; bottom: 14px; border: 26px solid #3C0C78; pointer-events: none; }
.inner-border { position: absolute; top: 38px; left: 38px; right: 38px; bottom: 38px; border: 6px solid #CB65FF; pointer-events: none; }
.pmhouse-logo { position: absolute; top: 56px; right: 60px; }
.pmhouse-logo img { height: 44px; width: auto; }
.content { position: absolute; top: 52px; left: 52px; right: 52px; bottom: 52px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
.pmi-atp-logo { margin-top: 24px; margin-bottom: 24px; }
.pmi-atp-logo img { height: 60px; width: auto; }
.cert-title { font-size: 26px; font-weight: 700; color: #3C0C78; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px; white-space: nowrap; }
.granted-text { font-size: 11.5px; color: #333; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 14px; }
.recipient-name { font-size: 36px; font-weight: 400; color: #3B3838; margin-bottom: 18px; }
.completing-text { font-size: 11.5px; color: #333; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 14px; }
.course-name { font-size: 22px; font-weight: 400; color: #3C0C78; margin-bottom: 10px; }
.cert-date { font-size: 15px; color: #3B3838; }
.bottom-section { position: absolute; bottom: 56px; left: 60px; right: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
.seal-area img { width: 110px; height: 110px; }
.instructor-area { text-align: center; flex: 1; }
.instructor-name { font-size: 12px; color: #3B3838; font-weight: 600; margin-bottom: 4px; }
.instructor-line { width: 160px; height: 1px; background: #3B3838; margin: 0 auto 4px; }
.instructor-label { font-size: 9.5px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
.company-area { text-align: right; }
.company-area img { height: 44px; width: auto; }
</style>
</head>
<body>
<div class="cert-page">
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="content">
    <div class="pmi-atp-logo">
      <img src="data:image/png;base64,${PMI_LOGO_B64}" alt="PMI ATP" />
    </div>
    <div class="cert-title">Certificate of Achievement</div>
    <div class="granted-text">Is Hereby Granted To</div>
    <div class="recipient-name">${certificate.name}</div>
    <div class="completing-text">For Completing the Following Course in 3 Hours</div>
    <div class="course-name">${certificate.course_name}</div>
    <div class="cert-date">${fDate}</div>
  </div>
  <div class="bottom-section">
    <div class="seal-area">
      <img src="data:image/png;base64,${PMI_SEAL_B64}" alt="PMI Seal" />
    </div>
    <div class="instructor-area">
      <div class="instructor-name">Akram Elnagar</div>
      <div class="instructor-line"></div>
      <div class="instructor-label">Name of Instructor</div>
    </div>
    <div class="company-area">
      <img src="data:image/png;base64,${PMI_LOGO_B64}" alt="PMHouse" />
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
      const { uri } = await Print.printToFileAsync({ html, width: 960, height: 680 });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        const res = await fetch(uri);
        const blob = await res.blob();
        link.href = URL.createObjectURL(blob);
        link.download = `PMHouse_Certificate_${certificate.name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (e) {
      try { await Print.printAsync({ html: generateCertificateHTML() }); } catch (e2) {}
    }
    setSharing(false);
  };

  const printCertificate = async () => {
    try { await Print.printAsync({ html: generateCertificateHTML() }); } catch (e) {}
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#3C0C78" /></View>;

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity testID="cert-back-btn" onPress={goBack} style={s.backBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#3C0C78" />
        </TouchableOpacity>
        <View style={s.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#94A3B8" />
          <Text style={s.errorTitle}>{t('الشهادة غير متاحة', 'Certificate Not Available')}</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.courseBtn} onPress={() => router.replace('/(tabs)/course')}>
            <Text style={s.courseBtnText}>{t('أكمل الدورة', 'Complete the Course')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fDate = formatDate(certificate?.issue_date || '');

  return (
    <SafeAreaView style={s.container}>
      <TouchableOpacity testID="cert-back-btn" onPress={goBack} style={s.backBtn}>
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#3C0C78" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Certificate Preview - matching PPTX exactly */}
        <View style={s.certCard}>
          <View style={s.outerBorder}>
            <View style={s.innerBorder}>
              {/* PMHouse logo top right */}
              <Image source={require('../assets/images/pmhouse-logo.png')} style={s.pmhouseLogo} resizeMode="contain" />

              <View style={s.certContent}>
                {/* ATP Logo top center */}
                <Image source={require('../assets/images/pmi-logo-cert.png')} style={s.atpLogo} resizeMode="contain" />

                <Text style={s.certTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
                <Text style={s.grantedText}>IS HEREBY GRANTED TO</Text>
                <Text style={s.recipientName}>{certificate?.name}</Text>
                <Text style={s.completingText}>FOR COMPLETING THE FOLLOWING COURSE IN 3 HOURS</Text>
                <Text style={s.courseName}>{certificate?.course_name}</Text>
                <Text style={s.certDate}>{fDate}</Text>
              </View>

              {/* Bottom section */}
              <View style={s.bottomRow}>
                {/* PMI Seal left */}
                <Image source={require('../assets/images/pmi-seal.png')} style={s.sealImg} resizeMode="contain" />

                {/* Instructor center */}
                <View style={s.instructorArea}>
                  <Text style={s.instructorName}>Akram Elnagar</Text>
                  <View style={s.instructorLine} />
                  <Text style={s.instructorLabel}>Name of Instructor</Text>
                </View>

                {/* ATP logo right */}
                <Image source={require('../assets/images/pmi-logo-cert.png')} style={s.companyLogo} resizeMode="contain" />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actions}>
          <TouchableOpacity testID="download-cert-btn" style={s.downloadBtn} onPress={shareCertificate} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name="download-outline" size={22} color="#fff" /><Text style={s.downloadText}>{t('تحميل PDF', 'Download PDF')}</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity testID="print-cert-btn" style={s.printBtn} onPress={printCertificate}>
            <Ionicons name="print-outline" size={22} color="#3C0C78" />
            <Text style={s.printText}>{t('طباعة الشهادة', 'Print Certificate')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F0' },
  backBtn: { padding: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#3C0C78', marginTop: 16 },
  errorText: { fontSize: 15, color: '#666', marginTop: 8, textAlign: 'center' },
  courseBtn: { backgroundColor: '#3C0C78', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  courseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll: { flexGrow: 1, padding: 12 },
  // Certificate card
  certCard: { backgroundColor: '#FFFFFF', borderRadius: 2, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 14, padding: 4 },
  outerBorder: { borderWidth: 8, borderColor: '#3C0C78', padding: 4 },
  innerBorder: { borderWidth: 2, borderColor: '#CB65FF', padding: 10, position: 'relative' },
  // PMHouse logo at top right
  pmhouseLogo: { position: 'absolute', top: 6, right: 6, width: 36, height: 36, zIndex: 10 },
  // Content
  certContent: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4 },
  // ATP logo at top center
  atpLogo: { width: 160, height: 48, marginBottom: 10, marginTop: 4 },
  // Title - one line
  certTitle: { fontSize: 11, fontWeight: '700', color: '#3C0C78', letterSpacing: 1, marginBottom: 6 },
  grantedText: { fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 8 },
  recipientName: { fontSize: 22, fontWeight: '400', color: '#3B3838', marginBottom: 10 },
  completingText: { fontSize: 7, color: '#333', letterSpacing: 2, marginBottom: 8 },
  courseName: { fontSize: 13, fontWeight: '400', color: '#3C0C78', marginBottom: 5 },
  certDate: { fontSize: 9, color: '#3B3838', marginBottom: 8 },
  // Bottom row
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingHorizontal: 2, marginTop: 4 },
  sealImg: { width: 64, height: 64 },
  instructorArea: { alignItems: 'center', flex: 1 },
  instructorName: { fontSize: 8, fontWeight: '600', color: '#3B3838', marginBottom: 3 },
  instructorLine: { width: 90, height: 1, backgroundColor: '#3B3838', marginBottom: 2 },
  instructorLabel: { fontSize: 6, color: '#888', letterSpacing: 1 },
  companyLogo: { width: 64, height: 32 },
  // Buttons
  actions: { gap: 10, marginTop: 16 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3C0C78', paddingVertical: 15, borderRadius: 8 },
  downloadText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 13, borderRadius: 8, borderWidth: 2, borderColor: '#3C0C78' },
  printText: { color: '#3C0C78', fontSize: 15, fontWeight: '700' },
});
