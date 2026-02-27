import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { configureAmplify } from '@/config/amplify';
import { ONBOARDING_KEY } from '@/constants/onboarding';
import { useNotifications } from '@/hooks/useNotifications';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { colors } from '@/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

configureAmplify();
void SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isLoading, isAuthenticated, needsConfirmation } = useAuth();
  useNotifications();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingComplete(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  const cognitoConfigured =
    process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== undefined &&
    process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID !== '';

  // Wait for onboarding check
  if (!onboardingChecked) {
    return null;
  }

  // Show onboarding first if not completed
  if (!onboardingComplete) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
        }}
      >
        <Stack.Screen name="onboarding" />
      </Stack>
    );
  }

  // Skip auth gate if Cognito isn't configured (local dev)
  if (!cognitoConfigured) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="idea/[id]" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg.primary,
        }}
      >
        <ActivityIndicator color={colors.amber[500]} size="large" />
      </View>
    );
  }

  if (needsConfirmation) {
    return <Redirect href="/(auth)/confirm" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="idea/[id]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
              <StatusBar style="light" />
              <AuthGate />
            </View>
          </AuthProvider>
        </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
