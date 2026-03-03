import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TrackTypePill } from '@/components/ideas/TrackTypePill';
import {
  TRACK_BUTTON_LABELS,
  TRACK_PLACEHOLDERS,
  TRACK_PROMPTS,
  TRACK_TYPES,
} from '@/constants/tracks';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import type { TrackType } from '@/types/idea';
import { hapticSuccess } from '@/utils/haptics';

interface AddIdeaSheetProps {
  onSubmit: (title: string, trackType: TrackType) => void;
}

export const AddIdeaSheet = forwardRef<BottomSheet, AddIdeaSheetProps>(function AddIdeaSheet(
  { onSubmit },
  ref,
) {
  const [title, setTitle] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('side_project');
  const prompt = TRACK_PROMPTS[selectedTrack];
  const snapPoints = useMemo(() => ['50%'], []);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed === '') return;
    hapticSuccess();
    onSubmit(trimmed, selectedTrack);
    setTitle('');
    if (ref && 'current' in ref && ref.current) {
      ref.current.close();
    }
  }, [title, selectedTrack, onSubmit, ref]);

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onAnimate={(_from, to) => {
        if (to === -1) Keyboard.dismiss();
      }}
    >
      <BottomSheetScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>What kind?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trackRow}
          >
            {TRACK_TYPES.map((t) => (
              <TrackTypePill
                key={t}
                trackType={t}
                isActive={selectedTrack === t}
                onPress={() => setSelectedTrack(t)}
              />
            ))}
          </ScrollView>

          <Text style={styles.prompt}>{prompt}</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder={TRACK_PLACEHOLDERS[selectedTrack]}
            placeholderTextColor={colors.text.muted}
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.submitButton, title.trim() === '' && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={title.trim() === ''}
          >
            <Text style={[styles.submitText, title.trim() === '' && styles.submitTextDisabled]}>
              {TRACK_BUTTON_LABELS[selectedTrack]}
            </Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
  },
  trackRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  prompt: {
    fontFamily: fontFamily.display.italic,
    fontSize: 18,
    color: colors.primary[500] + '88',
    lineHeight: 24,
  },
  input: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary[200],
  },
  submitText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.inverse,
  },
  submitTextDisabled: {
    color: colors.text.muted,
  },
});
