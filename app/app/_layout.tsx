// Polyfills must be imported before Amplify
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { OnboardingScreen } from '@/components/OnboardingScreen';
import { configureAmplify } from '@/config/amplify';
import { ONBOARDING_KEY } from '@/constants/onboarding';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNotifications } from '@/hooks/useNotifications';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { colors, fontFamily } from '@/theme/tokens';

export { ErrorBoundary } from 'expo-router';

configureAmplify();
void SplashScreen.preventAutoHideAsync();

const cognitoConfigured =
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== undefined &&
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== '';

// ── Auth routing — navigates based on auth state ─────────────
function AuthRouter() {
  const { isLoading, isAuthenticated, needsConfirmation, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { identify, reset } = useAnalytics();
  useNotifications();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user !== null) {
      identify(user.userId, { email: user.email });
    } else if (!isAuthenticated) {
      reset();
    }
  }, [isLoading, isAuthenticated, user, identify, reset]);

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
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [showBrandedSplash, setShowBrandedSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashTextOpacity = useRef(new Animated.Value(0)).current;

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
      Animated.sequence([
        Animated.timing(splashTextOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(splashOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => {
        setShowBrandedSplash(false);
      });
    }
  }, [loaded, onboardingChecked, splashOpacity, splashTextOpacity]);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
  }, []);

  if (!loaded || !onboardingChecked) {
    return null;
  }

  return (
    <AnalyticsProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <QueryProvider>
            <AuthProvider>
              <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
                <StatusBar style="dark" />
                {!onboardingComplete ? (
                  <OnboardingScreen onComplete={() => void handleOnboardingComplete()} />
                ) : cognitoConfigured ? (
                  <AuthRouter />
                ) : (
                  <LocalRouter />
                )}
                {showBrandedSplash && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      splashStyles.overlay,
                      { opacity: splashOpacity },
                    ]}
                  >
                    <Animated.Text style={[splashStyles.text, { opacity: splashTextOpacity }]}>
                      LaunchPad
                    </Animated.Text>
                  </Animated.View>
                )}
              </View>
            </AuthProvider>
          </QueryProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </AnalyticsProvider>
  );
}

const splashStyles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily.display.bold,
    fontSize: 28,
    lineHeight: 38,
    color: colors.primary[600],
    letterSpacing: 1,
  },
});
