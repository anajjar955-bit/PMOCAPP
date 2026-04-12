import React from 'react';
import { Stack } from 'expo-router';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_paid: boolean;
  progress: {
    completed_lessons: string[];
    quiz_scores: Record<string, number>;
    exam_attempts: any[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: async () => {}, register: async () => {},
  logout: async () => {}, refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ========== Language Context ==========
type Lang = 'ar' | 'en';

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (ar: string, en: string) => string;
  isRTL: boolean;
}

export const LangContext = createContext<LangContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (ar: string, _en: string) => ar,
  isRTL: true,
});

export const useLang = () => useContext(LangContext);

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('ar');

  useEffect(() => {
    checkAuth();
    loadLang();
  }, []);

  const loadLang = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_lang');
      if (saved === 'en' || saved === 'ar') setLang(saved);
    } catch (e) {}
  };

  const toggleLang = useCallback(async () => {
    const newLang: Lang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  }, [lang]);

  const t = useCallback((ar: string, en: string) => lang === 'ar' ? ar : en, [lang]);
  const isRTL = lang === 'ar';

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (e) {
      console.log('Auth check failed', e);
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    await AsyncStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    await AsyncStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.log('Refresh failed', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, isRTL }}>
      <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" />
          <Stack.Screen name="quiz/[lessonId]" />
          <Stack.Screen name="exam/[id]" />
          <Stack.Screen name="certificate" />
          <Stack.Screen name="payment" />
        </Stack>
      </AuthContext.Provider>
    </LangContext.Provider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
});
