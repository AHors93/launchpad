import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { IDEA_PROMPTS } from '@/constants/ideas';
import { useCreateIdea } from '@/hooks/useIdeas';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export const AddIdeaSheet = forwardRef<BottomSheet>(function AddIdeaSheet(_props, ref) {
  const [title, setTitle] = useState('');
  const createIdea = useCreateIdea();
  const prompt = useMemo(() => IDEA_PROMPTS[Math.floor(Math.random() * IDEA_PROMPTS.length)], []);
  const snapPoints = useMemo(() => ['35%'], []);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed === '') return;
    createIdea.mutate({ title: trimmed });
    setTitle('');
    if (ref && 'current' in ref && ref.current) {
      ref.current.close();
    }
  }, [title, createIdea, ref]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.prompt}>{prompt}</Text>
        <BottomSheetTextInput
          style={styles.input}
          placeholder="Your idea in a few words..."
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoFocus
        />
        <Pressable
          style={[styles.submitButton, title.trim() === '' && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={title.trim() === ''}
        >
          <Text style={[styles.submitText, title.trim() === '' && styles.submitTextDisabled]}>
            Save idea
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.bg.surfacePressed,
  },
  handleIndicator: {
    backgroundColor: colors.text.muted,
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  prompt: {
    fontFamily: fontFamily.display.italic,
    fontSize: 14,
    color: colors.amber[500] + '88',
    lineHeight: 20,
  },
  input: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  submitButton: {
    backgroundColor: colors.amber[500],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.amber[200],
  },
  submitText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: colors.text.inverse,
  },
  submitTextDisabled: {
    color: colors.text.muted,
  },
});
