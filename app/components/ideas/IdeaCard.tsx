import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { StatusPill } from '@/components/StatusPill';
import { animation, colors, fontFamily, radius, spacing, statusConfig } from '@/theme/tokens';
import { Idea, IdeaStatus } from '@/types/idea';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface IdeaCardProps {
  idea: Idea;
  onStatusChange: (ideaId: string, status: IdeaStatus) => void;
  onDelete: (ideaId: string) => void;
}

export function IdeaCard({ idea, onStatusChange, onDelete }: IdeaCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const statusObj = statusConfig.find((s) => s.value === idea.status) ?? statusConfig[0];

  const translateX = useSharedValue(0);
  const bgProgress = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      [colors.bg.surface, colors.bg.surfacePressed],
    ),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handlePressIn = () => {
    translateX.value = withSpring(4, { damping: 15, stiffness: 300 });
    bgProgress.value = withTiming(1, { duration: animation.fast });
  };

  const handlePressOut = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
    bgProgress.value = withTiming(0, { duration: animation.fast });
  };

  const handlePress = () => {
    setExpanded((prev) => !prev);
    chevronRotation.value = withSpring(expanded ? 0 : 180, {
      damping: 15,
      stiffness: 200,
    });
  };

  const handleCoach = () => {
    router.push({
      pathname: '/(tabs)/coach',
      params: {
        ideaId: idea.ideaId,
        ideaTitle: idea.title,
        ideaDesc: idea.description ?? '',
      },
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete idea', "Are you sure? This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(idea.ideaId),
      },
    ]);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          { borderLeftColor: statusObj.color, borderColor: statusObj.color + '33' },
          cardAnimatedStyle,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={2}>
              {idea.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusObj.color + '22' }]}>
                <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                  {statusObj.label}
                </Text>
              </View>
              <Text style={styles.dateText}>{formatDate(idea.createdAt)}</Text>
            </View>
          </View>

          <Animated.View style={chevronStyle}>
            <Text style={styles.chevron}>{'\u25BE'}</Text>
          </Animated.View>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {idea.description !== undefined &&
            idea.description !== null &&
            idea.description !== '' ? (
              <Text style={styles.description}>{idea.description}</Text>
            ) : null}

            <View style={styles.statusRow}>
              {statusConfig.map((s) => (
                <StatusPill
                  key={s.value}
                  status={s}
                  isActive={idea.status === s.value}
                  onPress={() => onStatusChange(idea.ideaId, s.value)}
                />
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleCoach}
                style={({ pressed }) => [styles.coachButton, pressed && styles.coachButtonPressed]}
              >
                <Text style={styles.coachButtonText}>{'\u{1F5E3}\u{FE0F}'} Ask Bob</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
  },
  dateText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
  },
  chevron: {
    fontSize: 18,
    color: '#666666',
  },
  expandedContent: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  description: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  coachButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.purple[300],
    backgroundColor: colors.purple[100],
  },
  coachButtonPressed: {
    backgroundColor: colors.purple[200],
  },
  coachButtonText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.purple[400],
  },
  removeButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.red[300],
    backgroundColor: 'transparent',
  },
  removeButtonText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.red[400] + '66',
  },
});
