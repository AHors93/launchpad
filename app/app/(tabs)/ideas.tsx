import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, fonts } from '@/theme/tokens';

export default function IdeasScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Idea Vault</Text>
        <Text style={styles.subtitle}>Your sparks, all in one place</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Sparks" count={0} color={colors.status.spark} />
        <StatBox label="Active" count={0} color={colors.status.building} />
        <StatBox label="Shipped" count={0} color={colors.status.shipped} />
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💡</Text>
        <Text style={styles.emptyTitle}>No ideas yet</Text>
        <Text style={styles.emptyText}>Tap + to capture your first spark</Text>
      </View>

      <Pressable style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function StatBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statCount: {
    fontFamily: fonts.mono,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
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
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.amber[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: colors.text.inverse,
    fontWeight: '600',
    lineHeight: 30,
  },
});
