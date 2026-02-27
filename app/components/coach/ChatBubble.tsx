import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, fontFamily, gradients, radius, spacing, typography } from '@/theme/tokens';
import { BobAction } from '@/types/action';
import { executeAction, getActionIcon, getActionLabel, parseMessage } from '@/utils/actions';
import { hapticMedium } from '@/utils/haptics';

interface ChatBubbleProps {
  role: 'user' | 'coach';
  text: string;
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isUser = role === 'user';

  const parsed = useMemo(
    () => (isUser ? { text, actions: [] } : parseMessage(text)),
    [text, isUser],
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, [opacity, translateY]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const bubbleRadius = {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: isUser ? 16 : 4,
    borderBottomRightRadius: isUser ? 4 : 16,
  };

  if (isUser) {
    return (
      <Animated.View style={[styles.row, styles.rowUser, enterStyle]}>
        <LinearGradient
          colors={gradients.userBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, bubbleRadius, styles.userGradient]}
        >
          <Text style={styles.messageText}>{text}</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.row, styles.rowCoach, enterStyle]}>
      <View style={[styles.bubble, bubbleRadius, styles.coachBubble]}>
        <Text style={styles.coachLabel}>Bob</Text>
        <Text style={styles.messageText}>{parsed.text}</Text>
        {parsed.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {parsed.actions.map((action, i) => (
              <ActionButton key={i} action={action} />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ActionButton({ action }: { action: BobAction }) {
  const handlePress = () => {
    hapticMedium();
    void executeAction(action);
  };

  return (
    <Pressable style={styles.actionButton} onPress={handlePress}>
      <Text style={styles.actionIcon}>{getActionIcon(action)}</Text>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {getActionLabel(action)}
      </Text>
    </Pressable>
  );
}

export function ThinkingIndicator() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (delay: number) =>
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: delay }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        ),
        -1,
      );

    dot1.value = pulse(0);
    dot2.value = pulse(200);
    dot3.value = pulse(400);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={[styles.row, styles.rowCoach]}>
      <View
        style={[
          styles.bubble,
          styles.coachBubble,
          {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 16,
          },
        ]}
      >
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowCoach: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  coachBubble: {
    backgroundColor: colors.bg.surfacePressed,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  userGradient: {
    borderWidth: 1,
    borderColor: '#2a1f3d',
  },
  coachLabel: {
    ...typography.chatLabel,
    marginBottom: spacing.sm,
  },
  messageText: {
    ...typography.chatMessage,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.amber[100],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amber[300],
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 12,
    color: colors.amber[500],
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted,
  },
});
