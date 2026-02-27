import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { INTEREST_SUGGESTIONS } from '@/constants/profile';
import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from '@/hooks/useNotifications';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

const DEFAULT_PREFS: NotificationPreferences = {
  nudgesEnabled: true,
  staleIdeaReminders: true,
  coachFollowUps: true,
  careerPathUpdates: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { handleSignOut, user, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  // Local form state — synced from profile query
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [careerBackground, setCareerBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    void getNotificationPreferences().then(setPrefs);
  }, []);

  // Sync profile data into local form state
  useEffect(() => {
    if (profile !== undefined) {
      setName(profile.name);
      setBio(profile.bio);
      setCareerBackground(profile.careerBackground);
      setGoals(profile.goals);
      setInterests(profile.interests);
    }
  }, [profile]);

  const togglePref = useCallback(
    (key: keyof NotificationPreferences) => {
      const updated = { ...prefs, [key]: !prefs[key] };
      setPrefs(updated);
      void updateNotificationPreferences({ [key]: updated[key] });
    },
    [prefs],
  );

  const toggleInterest = useCallback(
    (interest: string) => {
      hapticLight();
      const updated = interests.includes(interest)
        ? interests.filter((i) => i !== interest)
        : [...interests, interest];
      setInterests(updated);
      updateProfile.mutate({ interests: updated });
    },
    [interests, updateProfile],
  );

  const addCustomInterest = useCallback(() => {
    const trimmed = customInterest.trim();
    if (trimmed === '' || interests.includes(trimmed)) return;
    hapticSuccess();
    const updated = [...interests, trimmed];
    setInterests(updated);
    setCustomInterest('');
    updateProfile.mutate({ interests: updated });
  }, [customInterest, interests, updateProfile]);

  const saveField = useCallback(
    (field: 'name' | 'bio' | 'careerBackground' | 'goals', value: string) => {
      hapticSuccess();
      updateProfile.mutate({ [field]: value.trim() });
    },
    [updateProfile],
  );

  const onSignOut = useCallback(async () => {
    await handleSignOut();
  }, [handleSignOut]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <Text style={styles.sectionHint}>This helps Bob give you more relevant advice</Text>
          <View style={styles.card}>
            <ProfileField
              label="Name"
              placeholder="What should Bob call you?"
              value={name}
              onChangeText={setName}
              onBlur={() => saveField('name', name)}
            />
            <View style={styles.divider} />
            <ProfileField
              label="Career background"
              placeholder="e.g. 6 years in software engineering"
              value={careerBackground}
              onChangeText={setCareerBackground}
              onBlur={() => saveField('careerBackground', careerBackground)}
            />
            <View style={styles.divider} />
            <ProfileField
              label="Goals"
              placeholder="What are you working towards?"
              value={goals}
              onChangeText={setGoals}
              onBlur={() => saveField('goals', goals)}
              multiline
            />
            <View style={styles.divider} />
            <ProfileField
              label="About you"
              placeholder="Anything else Bob should know"
              value={bio}
              onChangeText={setBio}
              onBlur={() => saveField('bio', bio)}
              multiline
            />
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Interests</Text>
          <View style={styles.interestsGrid}>
            {INTEREST_SUGGESTIONS.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <Pressable
                  key={interest}
                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                    {interest}
                  </Text>
                </Pressable>
              );
            })}
            {interests
              .filter((i) => !INTEREST_SUGGESTIONS.includes(i))
              .map((interest) => (
                <Pressable
                  key={interest}
                  style={[styles.interestChip, styles.interestChipSelected]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.interestText, styles.interestTextSelected]}>{interest}</Text>
                </Pressable>
              ))}
          </View>
          <View style={styles.customInterestRow}>
            <TextInput
              style={styles.customInterestInput}
              placeholder="Add your own..."
              placeholderTextColor={colors.text.muted}
              value={customInterest}
              onChangeText={setCustomInterest}
              onSubmitEditing={addCustomInterest}
              returnKeyType="done"
            />
            <Pressable
              style={[
                styles.customInterestButton,
                customInterest.trim() === '' && styles.customInterestButtonDisabled,
              ]}
              onPress={addCustomInterest}
              disabled={customInterest.trim() === ''}
            >
              <Text style={styles.customInterestButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Account */}
        {isAuthenticated && user !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.card}>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              label="Idea nudges"
              desc="Encouragement when you add or progress ideas"
              value={prefs.nudgesEnabled}
              onToggle={() => togglePref('nudgesEnabled')}
            />
            <View style={styles.divider} />
            <SettingRow
              label="Stale idea reminders"
              desc="Ping when an idea hasn't moved in a while"
              value={prefs.staleIdeaReminders}
              onToggle={() => togglePref('staleIdeaReminders')}
            />
            <View style={styles.divider} />
            <SettingRow
              label="Bob follow-ups"
              desc="Action items from conversations with Bob"
              value={prefs.coachFollowUps}
              onToggle={() => togglePref('coachFollowUps')}
            />
            <View style={styles.divider} />
            <SettingRow
              label="Career path updates"
              desc="New info about saved career paths"
              value={prefs.careerPathUpdates}
              onToggle={() => togglePref('careerPathUpdates')}
            />
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={() => void onSignOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.version}>LaunchPad v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.profileFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.profileInput, multiline === true && styles.profileInputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        multiline={multiline}
        returnKeyType={multiline === true ? 'default' : 'done'}
      />
    </View>
  );
}

function SettingRow({
  label,
  desc,
  value,
  onToggle,
}: {
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.bg.input, true: colors.amber[300] }}
        thumbColor={value ? colors.amber[500] : colors.text.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    width: 40,
  },
  screenTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  section: {
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing['2xl'],
  },
  sectionLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  sectionHint: {
    fontFamily: fontFamily.display.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
  },
  email: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: spacing.lg,
  },
  rowLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 2,
  },
  rowDesc: {
    fontFamily: fontFamily.display.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.muted,
  },
  profileField: {
    gap: spacing.sm,
  },
  profileFieldLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
  profileInput: {
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
  profileInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.bg.surface,
  },
  interestChipSelected: {
    borderColor: colors.amber[400],
    backgroundColor: colors.amber[100],
  },
  interestText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.text.muted,
  },
  interestTextSelected: {
    fontFamily: fontFamily.mono.bold,
    color: colors.amber[500],
  },
  customInterestRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  customInterestInput: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  customInterestButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.amber[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  customInterestButtonDisabled: {
    backgroundColor: colors.amber[200],
  },
  customInterestButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.inverse,
    lineHeight: 22,
  },
  signOutButton: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing['3xl'],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red[300],
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: colors.red[400],
  },
  version: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
