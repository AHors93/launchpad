import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, fonts } from '@/theme/tokens';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Side Coach</Text>
        <Text style={styles.subtitle}>Your no-BS thinking partner</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>Ready when you are</Text>
        <Text style={styles.emptyText}>
          Start a conversation about an idea{'\n'}or a career move you&apos;re considering
        </Text>
      </View>

      <Pressable style={styles.startButton}>
        <Text style={styles.startButtonText}>Start a conversation</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fonts.mono,
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
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.amber[500],
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});
