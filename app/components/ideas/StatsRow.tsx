import { StyleSheet, Text, View } from 'react-native';

import { useIdeaStats } from '@/hooks/useIdeas';
import { colors, fontFamily, spacing } from '@/theme/tokens';

function StatBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: color + '0d', borderColor: color + '22' }]}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatsRow() {
  const { data: stats } = useIdeaStats();

  if ((stats?.total ?? 0) === 0) return null;

  return (
    <View style={styles.statsRow}>
      <StatBox label="Sparks" count={stats?.spark ?? 0} color={colors.status.spark} />
      <StatBox
        label="Active"
        count={(stats?.exploring ?? 0) + (stats?.building ?? 0)}
        color={colors.status.exploring}
      />
      <StatBox label="Shipped" count={stats?.shipped ?? 0} color={colors.status.shipped} />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCount: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 24,
  },
  statLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
