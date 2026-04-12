import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/pmhouse-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>PM House Academy</Text>
          <Text style={styles.subtitle}>الإعداد لاختبار</Text>
          <Text style={styles.certName}>PMI-PMO CP</Text>
          <Text style={styles.description}>
            دورة تدريبية مكثفة في 3 ساعات{'\n'}
            مع أمثلة عملية وأسئلة تفاعلية{'\n'}
            واختبارين تجريبيين محاكيين للاختبار الحقيقي
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="book-outline" text="25 درس تفاعلي" />
          <FeatureItem icon="help-circle-outline" text="50+ سؤال تدريبي" />
          <FeatureItem icon="document-text-outline" text="اختباران تجريبيان" />
          <FeatureItem icon="ribbon-outline" text="شهادة إتمام" />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            testID="get-started-btn"
            style={styles.primaryBtn}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryBtnText}>ابدأ الآن</Text>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="login-btn"
            style={styles.secondaryBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryBtnText}>لدي حساب بالفعل</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color="#1D4ED8" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 120, height: 120 },
  textContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#475569', marginBottom: 4 },
  certName: { fontSize: 24, fontWeight: '700', color: '#1D4ED8', marginBottom: 12 },
  description: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 },
  featureItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  featureText: { fontSize: 13, color: '#1E40AF', fontWeight: '600' },
  buttonContainer: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#1D4ED8', paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 2, borderColor: '#CBD5E1', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#475569', fontSize: 16, fontWeight: '600' },
});
