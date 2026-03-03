import { StyleSheet, Text, View } from 'react-native';

import { TRACK_CONFIG } from '@/constants/tracks';
import { IdeaStats } from '@/hooks/useIdeas';
import { colors, fontFamily, spacing } from '@/theme/tokens';
import type { TrackType } from '@/types/idea';

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '15' }]}>
      <Text style={[styles.chipCount, { color }]}>{count}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

interface StatsRowProps {
  stats: IdeaStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  if (stats.total === 0) return null;

  const trackEntries = Object.entries(stats.byTrack) as [TrackType, number][];
  const onlyTrack = trackEntries.length === 1 ? trackEntries[0][0] : undefined;

  // If only side_project track (or no byTrack data), show the classic view
  if (onlyTrack === 'side_project' || onlyTrack === undefined) {
    return (
      <View style={styles.statsRow}>
        <StatChip label="sparks" count={stats.spark} color={colors.status.spark} />
        <StatChip
          label="active"
          count={stats.exploring + stats.building}
          color={colors.status.exploring}
        />
        <StatChip label="shipped!" count={stats.shipped} color={colors.status.shipped} />
      </View>
    );
  }

  // Show track-type breakdown (single non-side_project track or multiple tracks)
  const sortedTracks = trackEntries.filter(([, count]) => count > 0).sort(([, a], [, b]) => b - a);

  return (
    <View style={styles.statsRow}>
      {sortedTracks.map(([trackType, count]) => {
        const config = TRACK_CONFIG[trackType];
        return (
          <StatChip
            key={trackType}
            label={config.label}
            count={count}
            color={colors.primary[500]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  chipCount: {
    fontFamily: fontFamily.display.bold,
    fontSize: 16,
  },
  chipLabel: {
    fontFamily: fontFamily.display.medium,
    fontSize: 13,
  },
});
