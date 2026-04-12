import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/QEL5ME5XAAD96";

export default function Payment() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const openPayPal = async () => {
    try {
      await Linking.openURL(PAYPAL_LINK);
    } catch (e) {
      Alert.alert('خطأ', 'لا يمكن فتح رابط الدفع');
    }
  };

  const confirmPayment = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transaction_id: 'paypal_manual' }),
      });
      if (res.ok) {
        await refreshUser();
        Alert.alert('تم التفعيل! ✓', 'يمكنك الآن الوصول لجميع الدروس والاختبارات', [
          { text: 'ابدأ التعلم', onPress: () => router.replace('/(tabs)/home') }
        ]);
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء التأكيد');
    }
    setConfirming(false);
  };

  if (user?.is_paid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paidContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
          <Text style={styles.paidTitle}>أنت مشترك بالفعل! ✓</Text>
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity testID="payment-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require('../assets/images/pmhouse-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>اشترك في الدورة</Text>
          <Text style={styles.subtitle}>الإعداد لاختبار PMI-PMO CP</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>سعر الاشتراك</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.priceAmount}>الدفع عبر PayPal</Text>
          </View>
          <Text style={styles.priceNote}>وصول كامل للدورة مدى الحياة</Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>يشمل الاشتراك:</Text>
          {[
            '25 درس تفاعلي مع شرائح عرض',
            '50+ سؤال تدريبي سيناريو',
            'اختباران تجريبيان كاملان',
            'شهادة إتمام من PM House',
            'وصول مدى الحياة للمحتوى',
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>خطوات الاشتراك:</Text>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>اضغط على زر "ادفع عبر PayPal" أدناه</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>أكمل عملية الدفع في PayPal</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>عد للتطبيق واضغط "تأكيد الدفع"</Text>
          </View>
        </View>

        <TouchableOpacity testID="pay-paypal-btn" style={styles.paypalBtn} onPress={openPayPal}>
          <Ionicons name="logo-paypal" size={24} color="#fff" />
          <Text style={styles.paypalBtnText}>ادفع عبر PayPal</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="confirm-payment-btn" style={styles.confirmBtn} onPress={confirmPayment} disabled={confirming}>
          {confirming ? <ActivityIndicator color="#1D4ED8" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#1D4ED8" />
              <Text style={styles.confirmBtnText}>تأكيد الدفع وتفعيل الاشتراك</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 70, height: 70, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 4 },
  priceCard: { backgroundColor: '#1D4ED8', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  priceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4, marginTop: 8 },
  currency: { fontSize: 20, color: '#fff', fontWeight: '700' },
  priceAmount: { fontSize: 20, fontWeight: '800', color: '#fff' },
  priceNote: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  features: { marginBottom: 20 },
  featuresTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 8 },
  featureText: { fontSize: 15, color: '#374151', flex: 1, textAlign: 'right' },
  stepsCard: { backgroundColor: '#FFF7ED', padding: 20, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFEDD5' },
  stepsTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  step: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepText: { fontSize: 14, color: '#374151', flex: 1, textAlign: 'right' },
  paypalBtn: { backgroundColor: '#0070BA', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 12 },
  paypalBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  confirmBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  confirmBtnText: { color: '#1D4ED8', fontSize: 16, fontWeight: '700' },
});
