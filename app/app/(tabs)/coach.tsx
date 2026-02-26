import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.header}>
        <Text style={styles.title}>Side Coach</Text>
        <Text style={styles.subtitle}>Your no-BS thinking partner</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{'\u{1F4AC}'}</Text>
        <Text style={styles.emptyTitle}>Ready when you are</Text>
        <Text style={styles.emptyText}>
          {"Start a conversation about an idea\nor a career move you're considering"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.startButton} onPress={() => {}}>
          <Text style={styles.startButtonText}>Start a conversation</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  startButton: {
    backgroundColor: colors.purple[400],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: '#ffffff',
  },
});
