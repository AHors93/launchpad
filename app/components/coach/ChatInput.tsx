import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const canSend = text.trim() !== '' && disabled !== true;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed === '' || disabled === true) return;
    hapticLight();
    onSend(trimmed);
    setText('');
  }, [text, onSend, disabled]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Ask Bob anything..."
        placeholderTextColor={colors.text.muted}
        multiline
        maxLength={2000}
        editable={disabled !== true}
      />
      <Pressable
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text style={[styles.sendButtonText, !canSend && styles.sendButtonTextDisabled]}>
          {'\u2191'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.purple[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bg.surface,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  sendButtonTextDisabled: {
    color: colors.text.muted,
  },
});
