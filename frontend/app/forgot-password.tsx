import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const WHATSAPP_NUMBER = '201005394312';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestReset = async () => {
    if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('code');
        setSuccess('تم إنشاء كود إعادة التعيين. تواصل مع الأدمن عبر واتساب لاستلام الكود.');
      } else {
        setError(data.detail || 'حدث خطأ');
      }
    } catch (e) { setError('حدث خطأ في الاتصال'); }
    setLoading(false);
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`مرحباً PM House\n\nأريد إعادة تعيين كلمة المرور\nالإيميل: ${email}\n\nشكراً`);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  const resetPassword = async () => {
    if (!code.trim()) { setError('يرجى إدخال الكود'); return; }
    if (newPassword.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('تم تغيير كلمة المرور بنجاح! سجل دخول الآن.');
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setError(data.detail || 'كود غير صحيح');
      }
    } catch (e) { setError('حدث خطأ'); }
    setLoading(false);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="forgot-back-btn" onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={step === 'email' ? 'lock-open' : 'key'} size={32} color="#1D4ED8" />
            </View>
          </View>

          <Text style={styles.title}>{step === 'email' ? 'نسيت كلمة المرور؟' : 'أدخل كود التفعيل'}</Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك كود إعادة التعيين عبر واتساب'
              : 'أدخل الكود اللي استلمته من الأدمن عبر واتساب'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success && step === 'code' ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {step === 'email' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <View style={styles.inputWrapper}>
                  <TextInput testID="reset-email-input" style={styles.input} value={email} onChangeText={(t) => { setEmail(t); setError(''); }}
                    placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94A3B8" textAlign="right" />
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                </View>
              </View>

              <TouchableOpacity testID="request-reset-btn" style={styles.primaryBtn} onPress={requestReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>إرسال طلب إعادة التعيين</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* WhatsApp Button */}
              <TouchableOpacity testID="wa-reset-btn" style={styles.waBtn} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
                <Text style={styles.waBtnText}>تواصل مع الأدمن عبر واتساب</Text>
              </TouchableOpacity>

              <View style={styles.stepsBox}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, styles.stepDone]}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                  <Text style={styles.stepText}>تم إنشاء كود إعادة التعيين</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepDot}><Text style={styles.stepNum}>2</Text></View>
                  <Text style={styles.stepText}>أرسل واتساب للأدمن لاستلام الكود</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepDot}><Text style={styles.stepNum}>3</Text></View>
                  <Text style={styles.stepText}>أدخل الكود وكلمة المرور الجديدة</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كود إعادة التعيين (6 أرقام)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput testID="reset-code-input" style={[styles.input, { textAlign: 'center', fontSize: 22, letterSpacing: 6 }]}
                    value={code} onChangeText={(t) => { setCode(t.replace(/\D/g, '')); setError(''); }}
                    placeholder="000000" keyboardType="number-pad" maxLength={6} placeholderTextColor="#94A3B8" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور الجديدة</Text>
                <View style={styles.inputWrapper}>
                  <TextInput testID="new-password-input" style={styles.input} value={newPassword} onChangeText={setNewPassword}
                    placeholder="6 أحرف على الأقل" secureTextEntry placeholderTextColor="#94A3B8" textAlign="right" />
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                </View>
              </View>

              <TouchableOpacity testID="confirm-reset-btn" style={styles.primaryBtn} onPress={resetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>تغيير كلمة المرور</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity testID="go-to-login-from-reset" onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>العودة لتسجيل الدخول</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { alignSelf: 'flex-start', padding: 8 },
  iconContainer: { alignItems: 'center', marginVertical: 20 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  errorBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14, flex: 1, textAlign: 'right' },
  successBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  successText: { color: '#16A34A', fontSize: 14, flex: 1, textAlign: 'right' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0F172A' },
  primaryBtn: { backgroundColor: '#1D4ED8', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  waBtn: { backgroundColor: '#25D366', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, marginBottom: 16 },
  waBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stepsBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  stepItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: '#16A34A' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  stepText: { fontSize: 13, color: '#374151', flex: 1, textAlign: 'right' },
  loginLink: { alignItems: 'center', marginTop: 20, paddingBottom: 32 },
  loginLinkText: { fontSize: 15, color: '#1D4ED8', fontWeight: '600' },
});
