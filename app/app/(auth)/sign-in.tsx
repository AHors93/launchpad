import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useAuth } from '@/providers/AuthProvider';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

export default function SignInScreen() {
  const router = useRouter();
  const { handleSignIn, handleAppleSignIn, isAppleSignInAvailable } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const canSubmit = email.trim() !== '' && password.length >= 8 && !isLoading;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    hapticLight();
    setIsLoading(true);
    try {
      await handleSignIn(email.trim().toLowerCase(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, email, password, handleSignIn]);

  const onAppleSignIn = useCallback(async () => {
    hapticLight();
    setAppleLoading(true);
    try {
      await handleAppleSignIn();
    } catch (error) {
      // User cancelled — not an error
      if (error instanceof Error && error.message.includes('ERR_REQUEST_CANCELED')) return;
      const message = error instanceof Error ? error.message : 'Apple sign-in failed';
      Alert.alert('Error', message);
    } finally {
      setAppleLoading(false);
    }
  }, [handleAppleSignIn]);

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brandLabel}>LaunchPad</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to pick up where you left off</Text>
        </View>

        {isAppleSignInAvailable && (
          <View style={styles.appleSection}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={radius.md}
              style={styles.appleButton}
              onPress={() => void onAppleSignIn()}
            />
            {appleLoading && <Text style={styles.appleLoadingText}>Connecting...</Text>}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  appleSection: {
    marginBottom: spacing['2xl'],
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  appleLoadingText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.medium,
  },
  dividerText: {
    fontFamily: fontFamily.display.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
    paddingHorizontal: spacing.lg,
  },
  brandLabel: {
    fontFamily: fontFamily.display.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary[500],
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
  },
  input: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary[200],
  },
  submitText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.inverse,
  },
  submitTextDisabled: {
    color: colors.text.muted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
  footerText: {
    fontFamily: fontFamily.display.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  footerLink: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.coral[400],
  },
});
