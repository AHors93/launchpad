import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useAuth } from '@/providers/AuthProvider';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export default function SignUpScreen() {
  const router = useRouter();
  const { handleSignUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const canSubmit = email.trim() !== '' && password.length >= 8 && passwordsMatch && !isLoading;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      await handleSignUp(email.trim().toLowerCase(), password);
      router.push('/(auth)/confirm');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, email, password, handleSignUp, router]);

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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start turning ideas into action</Text>
        </View>

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
              autoComplete="new-password"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, confirmPassword !== '' && !passwordsMatch && styles.inputError]}
              placeholder="Type it again"
              placeholderTextColor={colors.text.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            {confirmPassword !== '' && !passwordsMatch && (
              <Text style={styles.errorText}>{"Passwords don't match"}</Text>
            )}
          </View>

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
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
    marginBottom: spacing['4xl'],
  },
  brandLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.amber[500],
    textTransform: 'uppercase',
    letterSpacing: 3,
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
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  inputError: {
    borderColor: colors.red[400],
  },
  errorText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.red[400],
  },
  submitButton: {
    backgroundColor: colors.amber[500],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.amber[200],
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
    color: colors.amber[500],
  },
});
