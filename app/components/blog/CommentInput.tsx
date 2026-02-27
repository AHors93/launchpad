import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

interface CommentInputProps {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}

export function CommentInput({ onSubmit, isSubmitting }: CommentInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Leave a comment..."
        placeholderTextColor={colors.text.muted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />
      <Pressable
        style={[styles.button, text.trim() === '' && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={text.trim() === '' || isSubmitting}
      >
        <Text style={[styles.buttonText, text.trim() === '' && styles.buttonTextDisabled]}>
          Post
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxHeight: 100,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.amber[500],
    borderRadius: radius.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.amber[200],
  },
  buttonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 13,
    color: colors.text.inverse,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
});
