import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#1D4ED8" />
          </View>
          <Text style={styles.name}>{user?.name || 'المتدرب'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, user?.is_paid ? styles.badgePaid : styles.badgeFree]}>
            <Text style={[styles.badgeText, user?.is_paid ? styles.badgePaidText : styles.badgeFreeText]}>
              {user?.is_paid ? 'مشترك ✓' : 'حساب مجاني'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          {!user?.is_paid && (
            <TouchableOpacity testID="profile-subscribe" style={styles.menuItem} onPress={() => router.push('/payment')}>
              <Ionicons name="arrow-back" size={18} color="#94A3B8" />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>اشترك الآن</Text>
                <Text style={styles.menuSub}>احصل على وصول كامل للدورة</Text>
              </View>
              <Ionicons name="star" size={22} color="#EA580C" />
            </TouchableOpacity>
          )}

          <TouchableOpacity testID="profile-progress" style={styles.menuItem} onPress={() => router.push('/(tabs)/course')}>
            <Ionicons name="arrow-back" size={18} color="#94A3B8" />
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>تقدمي في الدورة</Text>
              <Text style={styles.menuSub}>{user?.progress?.completed_lessons?.length || 0} درس مكتمل</Text>
            </View>
            <Ionicons name="bar-chart" size={22} color="#1D4ED8" />
          </TouchableOpacity>

          <TouchableOpacity testID="profile-certificate" style={styles.menuItem} onPress={() => router.push('/certificate')}>
            <Ionicons name="arrow-back" size={18} color="#94A3B8" />
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>الشهادة</Text>
              <Text style={styles.menuSub}>شهادة إتمام الدورة</Text>
            </View>
            <Ionicons name="ribbon" size={22} color="#16A34A" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <Image source={require('../../assets/images/pmhouse-logo.png')} style={styles.aboutLogo} resizeMode="contain" />
            <Text style={styles.aboutTitle}>PM House Academy</Text>
            <Text style={styles.aboutText}>
              دورة مكثفة للإعداد لاختبار شهادة محترف مكتب إدارة المشاريع PMI-PMO CP
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  header: { alignItems: 'center', padding: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  email: { fontSize: 14, color: '#64748B', marginTop: 4 },
  badge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgePaid: { backgroundColor: '#DCFCE7' },
  badgeFree: { backgroundColor: '#FFF7ED' },
  badgeText: { fontSize: 14, fontWeight: '700' },
  badgePaidText: { color: '#16A34A' },
  badgeFreeText: { color: '#EA580C' },
  section: { marginHorizontal: 20, marginTop: 16 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  menuInfo: { flex: 1, marginHorizontal: 12 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  menuSub: { fontSize: 13, color: '#64748B', textAlign: 'right', marginTop: 2 },
  aboutCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  aboutLogo: { width: 60, height: 60, marginBottom: 12 },
  aboutTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  aboutText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  logoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
});
