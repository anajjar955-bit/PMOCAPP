import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Linking } from 'react-native';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminPanel() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<'codes' | 'users' | 'resets'>('users');
  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codes, setCodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCodes(), fetchUsers(), fetchResets()]);
    setLoading(false);
  };

  const fetchCodes = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/codes`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setCodes((await res.json()).codes || []);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers((await res.json()).users || []);
    } catch (e) {}
  };

  const fetchResets = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reset-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setResets((await res.json()).resets || []);
    } catch (e) {}
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
    } catch (e) {}
    setGenerating(false);
  };

  const copyText = async (text: string, key: string) => {
    try {
      await Clipboard.setStringAsync(text);
    } catch (e) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') navigator.clipboard?.writeText(text);
    }
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyWhatsAppMsg = (code: string) => {
    const msg = `مرحباً! 🎉\n\nتم تفعيل اشتراكك في دورة PMI-PMO CP من PM House.\n\nكود التفعيل:\n${code}\n\nأدخل الكود في صفحة الاشتراك في التطبيق.\n\nبالتوفيق! 🚀`;
    copyText(msg, 'msg_' + code);
  };

  const deleteUser = async (email: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { fetchUsers(); }
    } catch (e) {}
  };

  const [editingCode, setEditingCode] = useState('');
  const [newCodeEmail, setNewCodeEmail] = useState('');

  const reassignCode = async (code: string) => {
    if (!newCodeEmail.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/codes/${code}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newCodeEmail.trim() }),
      });
      if (res.ok) { setEditingCode(''); setNewCodeEmail(''); fetchCodes(); }
    } catch (e) {}
  };

  const exportExcel = async () => {
    const url = `${BACKEND_URL}/api/admin/export-users`;
    if (Platform.OS === 'web') {
      // Open in new tab to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pmhouse_users.xlsx');
      // Need to fetch with auth header
      try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (e) { console.log(e); }
    } else {
      try { await Linking.openURL(url); } catch (e) {}
    }
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccess}><Ionicons name="lock-closed" size={48} color="#94A3B8" /><Text style={styles.noAccessText}>للأدمن فقط</Text></View>
      </SafeAreaView>
    );
  }

  const paidUsers = users.filter(u => u.is_paid && u.role !== 'admin');
  const freeUsers = users.filter(u => !u.is_paid && u.role !== 'admin');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={28} color="#1D4ED8" />
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.statNum, { color: '#1D4ED8' }]}>{users.filter(u => u.role !== 'admin').length}</Text>
            <Text style={styles.statLabel}>إجمالي المستخدمين</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statNum, { color: '#16A34A' }]}>{paidUsers.length}</Text>
            <Text style={styles.statLabel}>مشتركين</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.statNum, { color: '#EA580C' }]}>{freeUsers.length}</Text>
            <Text style={styles.statLabel}>مجاني</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity testID="tab-users" style={[styles.tabBtn, tab === 'users' && styles.tabActive]} onPress={() => setTab('users')}>
            <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>المستخدمين</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="tab-codes" style={[styles.tabBtn, tab === 'codes' && styles.tabActive]} onPress={() => setTab('codes')}>
            <Text style={[styles.tabText, tab === 'codes' && styles.tabTextActive]}>الأكواد</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="tab-resets" style={[styles.tabBtn, tab === 'resets' && styles.tabActive]} onPress={() => setTab('resets')}>
            <Text style={[styles.tabText, tab === 'resets' && styles.tabTextActive]}>إعادة تعيين</Text>
          </TouchableOpacity>
        </View>

        {tab === 'users' && (
          <>
            {/* Export Button */}
            <TouchableOpacity testID="export-excel-btn" style={styles.exportBtn} onPress={exportExcel}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.exportBtnText}>تصدير Excel</Text>
            </TouchableOpacity>

            {/* Users List */}
            {loading ? <ActivityIndicator style={{ padding: 20 }} color="#1D4ED8" /> :
              users.filter(u => u.role !== 'admin').map((u, i) => (
                <View key={i} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: u.is_paid ? '#DCFCE7' : '#FEF2F2' }]}>
                      <Ionicons name="person" size={18} color={u.is_paid ? '#16A34A' : '#94A3B8'} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.name || 'بدون اسم'}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    <View style={[styles.statusBadge, u.is_paid ? styles.paidBadge : styles.freeBadge]}>
                      <Text style={[styles.statusText, { color: u.is_paid ? '#16A34A' : '#EA580C' }]}>
                        {u.is_paid ? 'مشترك' : 'مجاني'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressRow}>
                    <View style={styles.progressItem}>
                      <Text style={styles.progressLabel}>التقدم</Text>
                      <View style={styles.miniBar}><View style={[styles.miniFill, { width: `${u.progress_pct}%` }]} /></View>
                      <Text style={styles.progressVal}>{u.progress_pct}% ({u.completed_lessons}/{u.total_lessons})</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text style={styles.progressLabel}>اختبارات</Text>
                      <Text style={styles.progressVal}>متوسط: {u.avg_quiz_score}%</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text style={styles.progressLabel}>امتحان</Text>
                      <Text style={styles.progressVal}>{u.exam_attempts_count} محاولة • أعلى: {u.best_exam_score}%</Text>
                    </View>
                  </View>
                  <Text style={styles.userDate}>تسجيل: {u.created_at?.split('T')[0]}</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteUser(u.email)}>
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>حذف المتدرب</Text>
                  </TouchableOpacity>
                </View>
              ))
            }
          </>
        )}

        {tab === 'codes' && (
          <>
            {/* Generate Code */}
            <View style={styles.generateCard}>
              <Text style={styles.sectionTitle}>توليد كود تفعيل</Text>
              <View style={styles.inputRow}>
                <TextInput testID="admin-email-input" style={styles.emailInput} value={email} onChangeText={setEmail}
                  placeholder="user@email.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
                <TouchableOpacity testID="generate-code-btn" style={styles.generateBtn} onPress={generateCode} disabled={generating || !email.trim()}>
                  {generating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="key" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
              {generatedCode ? (
                <View style={styles.codeResult}>
                  <View style={styles.codeBox}><Text style={styles.codeText}>{generatedCode}</Text></View>
                  <View style={styles.codeActions}>
                    <TouchableOpacity testID="copy-code-btn" style={styles.copyBtn} onPress={() => copyText(generatedCode, generatedCode)}>
                      <Ionicons name={copied === generatedCode ? 'checkmark' : 'copy'} size={16} color="#1D4ED8" />
                      <Text style={styles.copyBtnText}>{copied === generatedCode ? 'تم!' : 'انسخ'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.waBtn} onPress={() => copyWhatsAppMsg(generatedCode)}>
                      <Ionicons name={copied === 'msg_' + generatedCode ? 'checkmark' : 'logo-whatsapp'} size={16} color="#25D366" />
                      <Text style={styles.waBtnText}>{copied === 'msg_' + generatedCode ? 'تم!' : 'رسالة واتساب'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
            <Text style={styles.listTitle}>الأكواد ({codes.length})</Text>
            {codes.map((c, i) => (
              <View key={i} style={styles.codeCard}>
                <View style={styles.codeCardRow}>
                  <View style={[styles.dot, c.used ? styles.dotUsed : styles.dotActive]} />
                  <Text style={styles.codeCardCode}>{c.code}</Text>
                  <TouchableOpacity onPress={() => copyText(c.code, c.code)}><Ionicons name={copied === c.code ? 'checkmark' : 'copy-outline'} size={16} color="#64748B" /></TouchableOpacity>
                </View>
                <Text style={styles.codeCardEmail}>{c.email} • {c.used ? 'مستخدم ✓' : 'نشط'} • {c.created_at?.split('T')[0]}</Text>
                {editingCode === c.code ? (
                  <View style={styles.reassignRow}>
                    <TextInput style={styles.reassignInput} value={newCodeEmail} onChangeText={setNewCodeEmail}
                      placeholder="الإيميل الجديد" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
                    <TouchableOpacity style={styles.reassignBtn} onPress={() => reassignCode(c.code)}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reassignCancel} onPress={() => { setEditingCode(''); setNewCodeEmail(''); }}>
                      <Ionicons name="close" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.reassignLink} onPress={() => { setEditingCode(c.code); setNewCodeEmail(c.email); }}>
                    <Ionicons name="swap-horizontal" size={14} color="#1D4ED8" />
                    <Text style={styles.reassignLinkText}>تغيير الإيميل</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {tab === 'resets' && (
          <>
            <Text style={styles.listTitle}>طلبات إعادة تعيين كلمة المرور ({resets.length})</Text>
            {resets.length === 0 ? (
              <View style={styles.emptyBox}><Ionicons name="lock-open-outline" size={32} color="#94A3B8" /><Text style={styles.emptyText}>لا توجد طلبات</Text></View>
            ) : resets.map((r, i) => (
              <View key={i} style={[styles.codeCard, !r.used && { borderColor: '#FCA5A5', borderWidth: 2 }]}>
                <View style={styles.codeCardRow}>
                  <View style={[styles.dot, r.used ? styles.dotUsed : { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.codeCardCode}>{r.name || r.email}</Text>
                  <Text style={{ fontSize: 12, color: r.used ? '#94A3B8' : '#DC2626', fontWeight: '700' }}>{r.used ? 'تم' : 'بانتظار'}</Text>
                </View>
                <Text style={styles.codeCardEmail}>{r.email} • {r.created_at?.split('T')[0]}</Text>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>الكود:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: 3 }}>{r.code}</Text>
                  <TouchableOpacity onPress={() => copyText(r.code, 'r_' + r.code)}><Ionicons name={copied === 'r_' + r.code ? 'checkmark' : 'copy-outline'} size={16} color="#1D4ED8" /></TouchableOpacity>
                </View>
                {!r.used && (
                  <TouchableOpacity style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-end' }}
                    onPress={() => {
                      const msg = 'كود إعادة تعيين كلمة المرور: ' + r.code + '\nأدخل الكود في نسيت كلمة المرور في التطبيق.\nPM House Academy';
                      copyText(msg, 'wr_' + r.code);
                    }}>
                    <Ionicons name={copied === 'wr_' + r.code ? 'checkmark' : 'logo-whatsapp'} size={14} color="#25D366" />
                    <Text style={{ fontSize: 12, color: '#25D366', fontWeight: '600' }}>{copied === 'wr_' + r.code ? 'تم النسخ!' : 'انسخ رسالة واتساب'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
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
  statsRow: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  tabs: { flexDirection: 'row-reverse', marginHorizontal: 16, marginTop: 16, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#1D4ED8' },
  exportBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16A34A', marginHorizontal: 16, marginTop: 16, paddingVertical: 12, borderRadius: 12 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  userCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  userHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'right' },
  userEmail: { fontSize: 12, color: '#64748B', textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  paidBadge: { backgroundColor: '#DCFCE7' },
  freeBadge: { backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  progressItem: { flex: 1 },
  progressLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginBottom: 4 },
  progressVal: { fontSize: 12, color: '#0F172A', textAlign: 'right', fontWeight: '600' },
  miniBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 4 },
  miniFill: { height: 4, backgroundColor: '#1D4ED8', borderRadius: 2 },
  userDate: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 8 },
  deleteBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteBtnText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  reassignRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  reassignInput: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#0F172A', textAlign: 'right' },
  reassignBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  reassignCancel: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  reassignLink: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-end' },
  reassignLinkText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  generateCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#1D4ED8' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10 },
  emailInput: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0F172A', textAlign: 'right' },
  generateBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  codeResult: { marginTop: 14 },
  codeBox: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, alignItems: 'center' },
  codeText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  codeActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 10 },
  copyBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 10 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  waBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingVertical: 8, borderRadius: 10 },
  waBtnText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginHorizontal: 16, marginTop: 16, textAlign: 'right' },
  codeCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  codeCardRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#16A34A' },
  dotUsed: { backgroundColor: '#94A3B8' },
  codeCardCode: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'right', letterSpacing: 1 },
  codeCardEmail: { fontSize: 12, color: '#64748B', textAlign: 'right', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  emptyBox: { alignItems: 'center', padding: 30, gap: 8 },
});
