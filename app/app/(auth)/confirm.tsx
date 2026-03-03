import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { useAuth } from '@/providers/AuthProvider';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export default function ConfirmScreen() {
  const router = useRouter();
  const { confirmationEmail, handleConfirmSignUp, handleResendCode } = useAuth();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = confirmationEmail ?? '';
  const canSubmit = code.trim().length >= 6 && !isLoading;

  const onSubmit = useCallback(async () => {
    if (!canSubmit || email === '') return;
    setIsLoading(true);
    try {
      await handleConfirmSignUp(email, code.trim());
      Alert.alert('Account confirmed', 'You can now sign in.', [
        { text: 'Sign in', onPress: () => router.replace('/(auth)/sign-in') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Confirmation failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, email, code, handleConfirmSignUp, router]);

  const onResend = useCallback(async () => {
    if (email === '') return;
    setIsResending(true);
    try {
      await handleResendCode(email);
      Alert.alert('Code sent', 'Check your email for a new verification code.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code';
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  }, [email, handleResendCode]);

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
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            {email !== ''
              ? `We sent a code to ${email}`
              : 'Enter the verification code we sent you'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={colors.text.muted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <Pressable
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Didn't get a code? "}</Text>
          <Pressable onPress={() => void onResend()} disabled={isResending}>
            <Text style={styles.footerLink}>{isResending ? 'Sending...' : 'Resend'}</Text>
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
    textAlign: 'center',
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
  codeInput: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    textAlign: 'center',
    letterSpacing: 4,
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
