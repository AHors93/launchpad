import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { INTEREST_SUGGESTIONS } from '@/constants/profile';
import { useUpdateProfile } from '@/hooks/useProfile';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

export interface ProfileSetupData {
  name: string;
  careerBackground: string;
  goals: string;
  interests: string[];
}

interface ProfileSetupProps {
  onComplete: (data: ProfileSetupData) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [careerBackground, setCareerBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = useCallback((interest: string) => {
    hapticLight();
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    hapticSuccess();
    const data: ProfileSetupData = {
      name: name.trim(),
      careerBackground: careerBackground.trim(),
      goals: goals.trim(),
      interests,
    };
    updateProfile.mutate(data);
    onComplete(data);
  }, [name, careerBackground, goals, interests, updateProfile, onComplete]);

  const canSubmit = name.trim() !== '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.wave}>{'\u{1F44B}'}</Text>
      <Text style={styles.title}>Help Bob help you</Text>
      <Text style={styles.subtitle}>
        A little context goes a long way. You can always update this in settings.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>What should Bob call you?</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.text.muted}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Career background</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 6 years in software engineering"
          placeholderTextColor={colors.text.muted}
          value={careerBackground}
          onChangeText={setCareerBackground}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>What are you working towards?</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Your goals, ambitions, what you're exploring..."
          placeholderTextColor={colors.text.muted}
          value={goals}
          onChangeText={setGoals}
          multiline
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestsGrid}>
          {INTEREST_SUGGESTIONS.map((interest) => {
            const isSelected = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        <Text style={styles.submitText}>{"Let's go"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  wave: {
    fontSize: 40,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.display.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing['3xl'],
  },
  field: {
    marginBottom: spacing['2xl'],
  },
  label: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    fontFamily: fontFamily.display.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.bg.surface,
  },
  chipSelected: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[100],
  },
  chipText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.text.muted,
  },
  chipTextSelected: {
    fontFamily: fontFamily.mono.bold,
    color: colors.amber[500],
  },
  submitButton: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.amber[500],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.amber[200],
  },
  submitText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.inverse,
  },
});
