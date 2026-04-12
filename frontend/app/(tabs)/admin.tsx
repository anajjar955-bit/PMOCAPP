import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const generateCode = async () => {
    if (!email.trim()) return;
    setGenerating(true);
    setGeneratedCode('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCode(data.code);
        fetchCodes();
      }
    } catch (e) { console.log(e); }
    setGenerating(false);
  };

  const copyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(code);
      setTimeout(() => setCopied(''), 2000);
    } catch (e) {
      // Fallback for web
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        navigator.clipboard?.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(''), 2000);
      }
    }
  };

  const copyWhatsAppMessage = async (code: string, userEmail: string) => {
    const msg = `مرحباً! 🎉\n\nتم تفعيل اشتراكك في دورة PMI-PMO CP من PM House.\n\nكود التفعيل الخاص بك:\n${code}\n\nأدخل الكود في صفحة الاشتراك في التطبيق.\n\nبالتوفيق! 🚀`;
    try {
      await Clipboard.setStringAsync(msg);
      setCopied('msg_' + code);
      setTimeout(() => setCopied(''), 2000);
    } catch (e) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        navigator.clipboard?.writeText(msg);
        setCopied('msg_' + code);
        setTimeout(() => setCopied(''), 2000);
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccess}>
          <Ionicons name="lock-closed" size={48} color="#94A3B8" />
          <Text style={styles.noAccessText}>هذه الصفحة للأدمن فقط</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={28} color="#1D4ED8" />
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
        </View>

        {/* Generate Code Section */}
        <View style={styles.generateCard}>
          <Text style={styles.sectionTitle}>توليد كود تفعيل جديد</Text>
          <Text style={styles.sectionSub}>أدخل إيميل المستخدم اللي سدد</Text>
          <View style={styles.inputRow}>
            <TextInput
              testID="admin-email-input"
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              placeholder="user@email.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity testID="generate-code-btn" style={styles.generateBtn} onPress={generateCode} disabled={generating || !email.trim()}>
              {generating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="key" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>

          {generatedCode ? (
            <View style={styles.codeResult}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{generatedCode}</Text>
              </View>
              <View style={styles.codeActions}>
                <TouchableOpacity testID="copy-code-btn" style={styles.copyBtn} onPress={() => copyCode(generatedCode)}>
                  <Ionicons name={copied === generatedCode ? 'checkmark' : 'copy'} size={18} color="#1D4ED8" />
                  <Text style={styles.copyBtnText}>{copied === generatedCode ? 'تم النسخ!' : 'انسخ الكود'}</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="copy-wa-msg-btn" style={styles.waBtn} onPress={() => copyWhatsAppMessage(generatedCode, email)}>
                  <Ionicons name={copied === 'msg_' + generatedCode ? 'checkmark' : 'logo-whatsapp'} size={18} color="#25D366" />
                  <Text style={styles.waBtnText}>{copied === 'msg_' + generatedCode ? 'تم النسخ!' : 'انسخ رسالة واتساب'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {/* Codes List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>الأكواد المولّدة ({codes.length})</Text>
          {loading ? <ActivityIndicator style={{ padding: 20 }} color="#1D4ED8" /> :
            codes.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد أكواد بعد</Text>
            ) : codes.map((code, i) => (
              <View key={i} style={styles.codeCard}>
                <View style={styles.codeCardHeader}>
                  <View style={[styles.statusDot, code.used ? styles.statusUsed : styles.statusActive]} />
                  <Text style={styles.codeCardCode}>{code.code}</Text>
                  <TouchableOpacity onPress={() => copyCode(code.code)} style={styles.miniCopyBtn}>
                    <Ionicons name={copied === code.code ? 'checkmark' : 'copy-outline'} size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.codeCardDetails}>
                  <Text style={styles.codeCardEmail}>{code.email}</Text>
                  <Text style={styles.codeCardStatus}>{code.used ? 'مستخدم ✓' : 'نشط'}</Text>
                </View>
                <Text style={styles.codeCardDate}>{code.created_at?.split('T')[0]}</Text>
                {!code.used && (
                  <TouchableOpacity style={styles.waSmallBtn} onPress={() => copyWhatsAppMessage(code.code, code.email)}>
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                    <Text style={styles.waSmallText}>انسخ رسالة واتساب</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          }
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  noAccess: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noAccessText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  generateCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#1D4ED8', marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#64748B', textAlign: 'right', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 10 },
  emailInput: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#0F172A', backgroundColor: '#F8FAFC', textAlign: 'right' },
  generateBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  codeResult: { marginTop: 16 },
  codeBox: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, alignItems: 'center' },
  codeText: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  codeActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  copyBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DBEAFE' },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  waBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  waBtnText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  listSection: { marginHorizontal: 16, marginTop: 24 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: 20 },
  codeCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  codeCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusActive: { backgroundColor: '#16A34A' },
  statusUsed: { backgroundColor: '#94A3B8' },
  codeCardCode: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'right', letterSpacing: 1 },
  miniCopyBtn: { padding: 4 },
  codeCardDetails: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 },
  codeCardEmail: { fontSize: 13, color: '#64748B' },
  codeCardStatus: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  codeCardDate: { fontSize: 12, color: '#94A3B8', textAlign: 'right', marginTop: 4 },
  waSmallBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end' },
  waSmallText: { fontSize: 12, color: '#25D366', fontWeight: '600' },
});
