import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
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
        setError(data.detail || 'Course not completed');
      }
    } catch (e) { setError('Failed to load certificate'); }
    setLoading(false);
  };

  const generateCertificateHTML = () => {
    if (!certificate) return '';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page { size: landscape; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.cert-outer { width: 960px; height: 680px; background: #FFFFFF; position: relative; padding: 12px; }
.cert-border { width: 100%; height: 100%; border: 3px solid #1B365D; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 60px; }
.gold-line { position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 1px solid #D4A843; pointer-events: none; }
.logo-section { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.logo-hex { width: 60px; height: 60px; background: #EA6A0B; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
.logo-inner { width: 52px; height: 52px; background: #1B365D; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
.logo-white { width: 44px; height: 44px; background: #FFFFFF; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
.logo-text-box { color: #1B365D; font-weight: 900; font-size: 9px; text-align: center; line-height: 1.1; }
.org-name { font-size: 16px; font-weight: 700; color: #1B365D; letter-spacing: 3px; }
.divider { width: 120px; height: 2px; background: #D4A843; margin: 16px 0; }
.cert-title { font-size: 32px; font-weight: 300; color: #1B365D; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 6px; }
.cert-sub { font-size: 13px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
.granted-text { font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
.recipient-name { font-size: 36px; font-weight: 700; color: #1B365D; margin-bottom: 8px; }
.name-line { width: 300px; height: 1px; background: #1B365D; margin-bottom: 24px; }
.course-label { font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
.course-name { font-size: 18px; font-weight: 600; color: #1B365D; margin-bottom: 4px; }
.course-name-sub { font-size: 14px; color: #444; margin-bottom: 30px; }
.footer-row { display: flex; justify-content: space-between; width: 100%; max-width: 600px; margin-top: auto; }
.footer-item { text-align: center; }
.footer-line { width: 140px; height: 1px; background: #1B365D; margin-bottom: 6px; }
.footer-label { font-size: 10px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
.footer-value { font-size: 12px; color: #1B365D; font-weight: 600; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="cert-outer">
<div class="cert-border">
<div class="gold-line"></div>
<div class="logo-section">
<div class="logo-hex"><div class="logo-inner"><div class="logo-white"><div class="logo-text-box">PM<br>HOUSE</div></div></div></div>
<div class="org-name">PM HOUSE</div>
</div>
<div class="divider"></div>
<div class="cert-title">Certificate of Achievement</div>
<div class="cert-sub">PMI Authorized Training Partner</div>
<div class="granted-text">Is Hereby Granted To</div>
<div class="recipient-name">${certificate.name}</div>
<div class="name-line"></div>
<div class="course-label">For Completing the Following Course</div>
<div class="course-name">${certificate.course_name}</div>
<div class="course-name-sub">PMI-PMO CP Intensive Preparation Program</div>
<div class="footer-row">
<div class="footer-item">
<div class="footer-value">${certificate.issue_date}</div>
<div class="footer-line"></div>
<div class="footer-label">Date</div>
</div>
<div class="footer-item">
<div class="footer-value">Ahmad Al-Najjar</div>
<div class="footer-line"></div>
<div class="footer-label">Instructor</div>
</div>
<div class="footer-item">
<div class="footer-value">${certificate.certificate_id}</div>
<div class="footer-line"></div>
<div class="footer-label">Certificate ID</div>
</div>
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

  if (loading) return <View style={s.loader}><ActivityIndicator size="large" color="#1B365D" /></View>;

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity testID="cert-back-btn" onPress={goBack} style={s.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#1B365D" />
        </TouchableOpacity>
        <View style={s.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#94A3B8" />
          <Text style={s.errorTitle}>Certificate Not Available</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.courseBtn} onPress={() => router.replace('/(tabs)/course')}>
            <Text style={s.courseBtnText}>Complete the Course</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <TouchableOpacity testID="cert-back-btn" onPress={goBack} style={s.backBtn}>
        <Ionicons name="arrow-forward" size={24} color="#1B365D" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Certificate Preview */}
        <View style={s.certCard}>
          <View style={s.certBorder}>
            <View style={s.goldLine} />
            {/* Logo */}
            <Image source={require('../assets/images/pmhouse-logo.png')} style={s.certLogo} resizeMode="contain" />
            <Text style={s.orgName}>PM HOUSE</Text>
            <View style={s.divider} />
            <Text style={s.certTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
            <Text style={s.certSub}>PMI Authorized Training Partner</Text>
            <Text style={s.grantedText}>IS HEREBY GRANTED TO</Text>
            <Text style={s.recipientName}>{certificate?.name}</Text>
            <View style={s.nameLine} />
            <Text style={s.courseLabel}>FOR COMPLETING THE FOLLOWING COURSE</Text>
            <Text style={s.courseName}>{certificate?.course_name}</Text>
            <Text style={s.courseNameSub}>PMI-PMO CP Intensive Preparation Program</Text>
            {/* Footer */}
            <View style={s.footerRow}>
              <View style={s.footerItem}>
                <Text style={s.footerValue}>{certificate?.issue_date}</Text>
                <View style={s.footerLine} />
                <Text style={s.footerLabel}>Date</Text>
              </View>
              <View style={s.footerItem}>
                <Text style={s.footerValue}>Ahmad Al-Najjar</Text>
                <View style={s.footerLine} />
                <Text style={s.footerLabel}>Instructor</Text>
              </View>
              <View style={s.footerItem}>
                <Text style={s.footerValue}>{certificate?.certificate_id}</Text>
                <View style={s.footerLine} />
                <Text style={s.footerLabel}>Certificate ID</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Action Buttons */}
        <View style={s.actions}>
          <TouchableOpacity testID="download-cert-btn" style={s.downloadBtn} onPress={shareCertificate} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name="download-outline" size={22} color="#fff" /><Text style={s.downloadText}>Download PDF</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity testID="print-cert-btn" style={s.printBtn} onPress={printCertificate}>
            <Ionicons name="print-outline" size={22} color="#1B365D" />
            <Text style={s.printText}>Print Certificate</Text>
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
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#1B365D', marginTop: 16 },
  errorText: { fontSize: 15, color: '#666', marginTop: 8, textAlign: 'center' },
  courseBtn: { backgroundColor: '#1B365D', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  courseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll: { flexGrow: 1, padding: 12 },
  certCard: { backgroundColor: '#FFFFFF', borderRadius: 4, padding: 10, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  certBorder: { borderWidth: 3, borderColor: '#1B365D', padding: 24, alignItems: 'center', position: 'relative' },
  goldLine: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1, borderColor: '#D4A843' },
  certLogo: { width: 56, height: 56, marginBottom: 6 },
  orgName: { fontSize: 14, fontWeight: '700', color: '#1B365D', letterSpacing: 3 },
  divider: { width: 100, height: 2, backgroundColor: '#D4A843', marginVertical: 12 },
  certTitle: { fontSize: 20, fontWeight: '300', color: '#1B365D', letterSpacing: 3, marginBottom: 4 },
  certSub: { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 16 },
  grantedText: { fontSize: 9, color: '#888', letterSpacing: 2, marginBottom: 8 },
  recipientName: { fontSize: 26, fontWeight: '700', color: '#1B365D', marginBottom: 6 },
  nameLine: { width: 220, height: 1, backgroundColor: '#1B365D', marginBottom: 16 },
  courseLabel: { fontSize: 9, color: '#888', letterSpacing: 2, marginBottom: 8 },
  courseName: { fontSize: 15, fontWeight: '600', color: '#1B365D', marginBottom: 2 },
  courseNameSub: { fontSize: 12, color: '#666', marginBottom: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 8, marginTop: 8 },
  footerItem: { alignItems: 'center', flex: 1 },
  footerValue: { fontSize: 11, fontWeight: '600', color: '#1B365D', marginBottom: 4 },
  footerLine: { width: 100, height: 1, backgroundColor: '#1B365D', marginBottom: 4 },
  footerLabel: { fontSize: 8, color: '#888', letterSpacing: 1 },
  actions: { gap: 10, marginTop: 16 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1B365D', paddingVertical: 15, borderRadius: 8 },
  downloadText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 13, borderRadius: 8, borderWidth: 2, borderColor: '#1B365D' },
  printText: { color: '#1B365D', fontSize: 15, fontWeight: '700' },
});
