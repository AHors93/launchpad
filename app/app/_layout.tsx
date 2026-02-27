// Polyfills must be imported before Amplify
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { OnboardingScreen } from '@/components/OnboardingScreen';
import { configureAmplify } from '@/config/amplify';
import { ONBOARDING_KEY } from '@/constants/onboarding';
import { useNotifications } from '@/hooks/useNotifications';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { colors } from '@/theme/tokens';

export { ErrorBoundary } from 'expo-router';

configureAmplify();
void SplashScreen.preventAutoHideAsync();

const cognitoConfigured =
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== undefined &&
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== '';

// ── Auth routing — navigates based on auth state ─────────────
function AuthRouter() {
  const { isLoading, isAuthenticated, needsConfirmation } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  useNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (needsConfirmation && segments[1] !== 'confirm') {
      router.replace('/(auth)/confirm');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/ideas');
    }
  }, [isLoading, isAuthenticated, needsConfirmation, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="idea/[id]" />
      <Stack.Screen name="blog/index" />
      <Stack.Screen name="blog/[postId]" />
      <Stack.Screen name="blog/compose" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// ── No-auth routing — skip straight to tabs ──────────────────
function LocalRouter() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="idea/[id]" />
      <Stack.Screen name="blog/index" />
      <Stack.Screen name="blog/[postId]" />
      <Stack.Screen name="blog/compose" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// ── Root layout ──────────────────────────────────────────────
export default function RootLayout() {
  const [loaded, error] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Uncomment to reset onboarding for testing:
    // void AsyncStorage.removeItem(ONBOARDING_KEY);
    void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingComplete(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && onboardingChecked) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, onboardingChecked]);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
  }, []);

  if (!loaded || !onboardingChecked) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
              <StatusBar style="light" />
              {!onboardingComplete ? (
                <OnboardingScreen onComplete={() => void handleOnboardingComplete()} />
              ) : cognitoConfigured ? (
                <AuthRouter />
              ) : (
                <LocalRouter />
              )}
            </View>
          </AuthProvider>
        </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
