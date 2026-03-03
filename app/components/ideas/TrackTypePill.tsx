import { Pressable, StyleSheet, Text } from 'react-native';

import { TRACK_CONFIG } from '@/constants/tracks';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import type { TrackType } from '@/types/idea';

interface TrackTypePillProps {
  trackType: TrackType;
  isActive: boolean;
  onPress: () => void;
}

export function TrackTypePill({ trackType, isActive, onPress }: TrackTypePillProps) {
  const config = TRACK_CONFIG[trackType];
  const activeColor = colors.primary[500];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          borderColor: isActive ? activeColor : colors.border.medium,
          backgroundColor: isActive ? activeColor + '22' : 'transparent',
        },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text
        style={[styles.label, { color: isActive ? activeColor : colors.text.muted }]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
  },
});
