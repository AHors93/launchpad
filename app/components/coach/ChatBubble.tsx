import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, gradients, spacing, typography } from '@/theme/tokens';

interface ChatBubbleProps {
  role: 'user' | 'coach';
  text: string;
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isUser = role === 'user';

  const bubbleRadius = {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: isUser ? 16 : 4,
    borderBottomRightRadius: isUser ? 4 : 16,
  };

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <LinearGradient
          colors={gradients.userBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, bubbleRadius, styles.userGradient]}
        >
          <Text style={styles.messageText}>{text}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowCoach]}>
      <View style={[styles.bubble, bubbleRadius, styles.coachBubble]}>
        <Text style={styles.coachLabel}>Coach</Text>
        <Text style={styles.messageText}>{text}</Text>
      </View>
    </View>
  );
}

export function ThinkingIndicator() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

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
        <Text style={styles.thinkingText}>thinking{dots}</Text>
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
  thinkingText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.muted,
  },
});
