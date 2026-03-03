import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

interface StatusPillStatus {
  value: string;
  label: string;
  color: string;
}

interface StatusPillProps {
  status: StatusPillStatus;
  isActive: boolean;
  onPress: () => void;
}

export function StatusPill({ status, isActive, onPress }: StatusPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.statusPill,
        {
          borderColor: isActive ? status.color : colors.border.medium,
          backgroundColor: isActive ? status.color + '22' : 'transparent',
        },
      ]}
    >
      <Text style={[styles.statusPillText, { color: isActive ? status.color : colors.text.muted }]}>
        {status.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
  },
});
