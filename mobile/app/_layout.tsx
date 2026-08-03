import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { ClogEventProvider } from '../lib/ClogEventContext';

import "../global.css";

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'change-password' ||
      segments[0] === 'privacy-consent' ||
      segments[0] === 'forgot-password';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && !user.privacy_agreed_at && segments[0] !== 'privacy-consent') {
      router.replace('/privacy-consent');
    } else if ( user && user.privacy_agreed_at && user.must_change_password && segments[0] !== 'change-password') {
      router.replace('/change-password');
    } else if (user && user.privacy_agreed_at && !user.must_change_password && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-consent" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="clog-details" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ClogEventProvider>
        <ThemeProvider value={DefaultTheme}>
          <AuthGate />
          <StatusBar style="dark" />
        </ThemeProvider>
      </ClogEventProvider>
    </AuthProvider>
  );
}