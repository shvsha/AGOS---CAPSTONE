import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/AuthContext';

import "../global.css";

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'change-password';

    if (!user && !inAuthGroup) {
      // Not logged in, and not already on an auth screen → send to login
      router.replace('/login');
    } else if (user && user.must_change_password && segments[0] !== 'change-password') {
      // Logged in but must change password → lock them to that screen
      router.replace('/change-password');
    } else if (user && !user.must_change_password && inAuthGroup) {
      // Logged in and cleared password change, but still on login/change-password → send to tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}