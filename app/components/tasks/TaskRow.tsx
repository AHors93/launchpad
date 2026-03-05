import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { Task } from '@/types/task';

interface TaskRowProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 0 && diffMins > -60) return 'Overdue';
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === -1 || (diffHours < 0 && diffHours > -24)) return 'Overdue';
  if (diffMins >= 0 && diffMins < 60) return `in ${diffMins}m`;
  if (diffHours >= 0 && diffHours < 24) return `in ${diffHours}h`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `in ${diffDays}d`;

  return due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getDueColor(dueDate: string, status: string): string {
  if (status === 'done') return colors.status.shipped;
  const due = new Date(dueDate);
  const now = new Date();
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return colors.coral[400];
  if (diffHours < 24) return colors.primary[500];
  return colors.text.muted;
}

export function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const isDone = task.status === 'done';

  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isDone ? colors.purple[400] : 'transparent', { duration: 200 }),
    borderColor: withTiming(isDone ? colors.purple[400] : colors.border.medium, { duration: 200 }),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isDone ? 0.5 : 1, { duration: 200 }),
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.row}
    >
      <Pressable onPress={() => onToggle(task.taskId)} style={styles.checkArea} hitSlop={8}>
        <Animated.View style={[styles.checkbox, checkStyle]}>
          {isDone && <Text style={styles.checkmark}>{'\u2713'}</Text>}
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.content, textStyle]}>
        <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={[styles.dueText, { color: getDueColor(task.dueDate, task.status) }]}>
          {isDone ? 'Done' : formatDueDate(task.dueDate)}
          {task.source === 'bob' && ' \u00B7 from Bob'}
        </Text>
      </Animated.View>

      <Pressable onPress={() => onDelete(task.taskId)} style={styles.deleteArea} hitSlop={8}>
        <Text style={styles.deleteIcon}>{'\u00D7'}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  checkArea: {
    padding: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 13,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  dueText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    marginTop: 2,
  },
  deleteArea: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 18,
    color: colors.text.muted,
    fontWeight: '300',
  },
});
