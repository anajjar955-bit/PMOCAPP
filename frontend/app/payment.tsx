import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/QEL5ME5XAAD96";
const WHATSAPP_NUMBER = "201005394312";

export default function Payment() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');

  const openPayPal = async () => {
    try { await Linking.openURL(PAYPAL_LINK); } catch (e) { }
  };

  const openWhatsApp = async () => {
    const message = encodeURIComponent(
      `مرحباً PM House\n\nأريد تفعيل اشتراكي في دورة PMI-PMO CP\n\nالاسم: ${user?.name || ''}\nالإيميل: ${user?.email || ''}\n\nتم الدفع عبر PayPal`
    );
    try { await Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`); } catch (e) { }
  };

  const activateCode = async () => {
    if (!activationCode.trim()) { setCodeError('يرجى إدخال كود التفعيل'); return; }
    setCodeError('');
    setCodeSuccess('');
    setActivating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: activationCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSuccess(data.message || 'تم التفعيل بنجاح!');
        await refreshUser();
        setTimeout(() => router.replace('/(tabs)/home'), 1500);
      } else {
        setCodeError(data.detail || 'كود غير صحيح');
      }
    } catch (e) { setCodeError('حدث خطأ، حاول مرة أخرى'); }
    setActivating(false);
  };

  if (user?.is_paid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paidContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
          <Text style={styles.paidTitle}>أنت مشترك بالفعل!</Text>
          <Text style={styles.paidSub}>لديك وصول كامل لجميع الدروس والاختبارات</Text>
          <TouchableOpacity testID="go-to-course" style={styles.paidBtn} onPress={() => router.replace('/(tabs)/course')}>
            <Text style={styles.paidBtnText}>متابعة التعلم</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="payment-back-btn" onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/home');
          }} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Image source={require('../assets/images/pmhouse-logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>اشترك في الدورة</Text>
          </View>

          {/* Activation Code Section */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="key" size={22} color="#1D4ED8" />
              <Text style={styles.codeTitle}>عندك كود تفعيل؟</Text>
            </View>
            <Text style={styles.codeSub}>أدخل الكود اللي استلمته بعد الدفع</Text>
            <View style={styles.codeInputRow}>
              <TextInput
                testID="activation-code-input"
                style={styles.codeInput}
                value={activationCode}
                onChangeText={(t) => { setActivationCode(t.toUpperCase()); setCodeError(''); }}
                placeholder="PMH-XXXX-XXXX"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                textAlign="center"
              />
              <TouchableOpacity testID="activate-code-btn" style={styles.codeBtn} onPress={activateCode} disabled={activating}>
                {activating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={22} color="#fff" />}
              </TouchableOpacity>
            </View>
            {codeError ? (
              <View style={styles.codeErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.codeErrorText}>{codeError}</Text>
              </View>
            ) : null}
            {codeSuccess ? (
              <View style={styles.codeSuccessBox}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.codeSuccessText}>{codeSuccess}</Text>
              </View>
            ) : null}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو اشترك الآن</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Steps */}
          <View style={styles.stepsCard}>
            <View style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>ادفع عبر PayPal</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: '#25D366' }]}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>أرسل إيصال الدفع عبر واتساب</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: '#1D4ED8' }]}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepText}>استلم كود التفعيل وأدخله أعلاه</Text>
            </View>
          </View>

          <TouchableOpacity testID="pay-paypal-btn" style={styles.paypalBtn} onPress={openPayPal}>
            <Ionicons name="logo-paypal" size={24} color="#fff" />
            <Text style={styles.paypalBtnText}>ادفع عبر PayPal</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="whatsapp-confirm-btn" style={styles.whatsappBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            <Text style={styles.whatsappBtnText}>أرسل الإيصال عبر واتساب</Text>
          </TouchableOpacity>

          {/* Features */}
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>يشمل الاشتراك:</Text>
            {['24 درس مع شرح صوتي بالعامية المصرية', '50+ سؤال تدريبي سيناريو', 'اختباران تجريبيان كاملان', 'شهادة إتمام من PM House'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { paddingVertical: 12 },
  paidContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  paidTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 16 },
  paidSub: { fontSize: 15, color: '#64748B', marginTop: 8, textAlign: 'center' },
  paidBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  paidBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 60, height: 60, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  codeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#1D4ED8', marginBottom: 20 },
  codeHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 6 },
  codeTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  codeSub: { fontSize: 13, color: '#64748B', textAlign: 'right', marginBottom: 14 },
  codeInputRow: { flexDirection: 'row-reverse', gap: 10 },
  codeInput: { flex: 1, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 18, fontWeight: '700', color: '#0F172A', backgroundColor: '#F8FAFC', letterSpacing: 2 },
  codeBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  codeErrorBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10 },
  codeErrorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  codeSuccessBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10 },
  codeSuccessText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  stepsCard: { backgroundColor: '#FFF7ED', padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  step: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { fontSize: 14, color: '#374151', flex: 1, textAlign: 'right' },
  paypalBtn: { backgroundColor: '#0070BA', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, marginBottom: 10 },
  paypalBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, marginBottom: 20 },
  whatsappBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  features: { marginBottom: 8 },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 10 },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 6 },
  featureText: { fontSize: 14, color: '#374151', flex: 1, textAlign: 'right' },
});
