import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/QEL5ME5XAAD96";
const WHATSAPP_NUMBER = "201005394312";

export default function Payment() {
  const { user } = useAuth();
  const router = useRouter();

  const openPayPal = async () => {
    try {
      await Linking.openURL(PAYPAL_LINK);
    } catch (e) {
      Alert.alert('خطأ', 'لا يمكن فتح رابط الدفع');
    }
  };

  const openWhatsApp = async () => {
    const message = encodeURIComponent(
      `مرحباً PM House 🏠\n\nأريد تفعيل اشتراكي في دورة PMI-PMO CP\n\nالاسم: ${user?.name || ''}\nالإيميل: ${user?.email || ''}\n\nتم الدفع عبر PayPal ✓`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch (e) {
      Alert.alert('خطأ', 'لا يمكن فتح واتساب');
    }
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
            <Text style={styles.priceAmount}>الدفع عبر PayPal</Text>
          </View>
          <Text style={styles.priceNote}>وصول كامل للدورة مدى الحياة</Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>يشمل الاشتراك:</Text>
          {[
            '24 درس تفاعلي مع شرح صوتي بالعربي',
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
            <View style={[styles.stepNum, { backgroundColor: '#25D366' }]}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>أرسل إيصال الدفع عبر واتساب للتفعيل</Text>
          </View>
        </View>

        <TouchableOpacity testID="pay-paypal-btn" style={styles.paypalBtn} onPress={openPayPal}>
          <Ionicons name="logo-paypal" size={24} color="#fff" />
          <Text style={styles.paypalBtnText}>ادفع عبر PayPal</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="whatsapp-confirm-btn" style={styles.whatsappBtn} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.whatsappBtnText}>أرسل إيصال الدفع عبر واتساب</Text>
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.contactText}>
            بعد الدفع، أرسل صورة الإيصال على واتساب وسيتم تفعيل حسابك خلال دقائق
          </Text>
        </View>

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
  stepText: { fontSize: 14, color: '#374141', flex: 1, textAlign: 'right' },
  paypalBtn: { backgroundColor: '#0070BA', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 12 },
  paypalBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 16 },
  whatsappBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  contactInfo: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, backgroundColor: '#F1F5F9', padding: 14, borderRadius: 12 },
  contactText: { flex: 1, fontSize: 13, color: '#64748B', textAlign: 'right', lineHeight: 20 },
});
