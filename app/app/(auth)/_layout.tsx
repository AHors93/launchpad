import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
