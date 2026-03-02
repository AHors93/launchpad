import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as MailComposer from 'expo-mail-composer';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { INTEREST_SUGGESTIONS } from '@/constants/profile';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from '@/hooks/useNotifications';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/providers/AuthProvider';
import { isBackendConfigured, deleteAccountApi } from '@/services/api';
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
  const { track } = useAnalytics();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  // Local form state — synced from profile query
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [careerBackground, setCareerBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [savedField, setSavedField] = useState<string | null>(null);

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
      const trimmed = value.trim();
      const current = profile?.[field] ?? '';
      if (trimmed === current) return;
      hapticSuccess();
      updateProfile.mutate({ [field]: trimmed });
      setSavedField(field);
      setTimeout(() => {
        setSavedField((prev) => (prev === field ? null : prev));
      }, 1600);
    },
    [updateProfile, profile],
  );

  const handleFeedback = useCallback(async () => {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      Alert.alert('No mail app', 'You can email feedback to adam.horscraft@gmail.com');
      return;
    }
    await MailComposer.composeAsync({
      recipients: ['adam.horscraft@gmail.com'],
      subject: 'LaunchPad Feedback',
      body: `\n\n---\nLaunchPad v${Application.nativeApplicationVersion ?? '1.0.0'}`,
    });
    track({ name: 'feedback_sent' });
  }, [track]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data — ideas, conversations, saved paths, everything. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                if (isBackendConfigured()) {
                  await deleteAccountApi();
                }
                if (router.canDismiss()) {
                  router.dismiss();
                }
                await handleSignOut();
              } catch {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            })();
          },
        },
      ],
    );
  }, [handleSignOut, router]);

  const onSignOut = useCallback(async () => {
    if (router.canDismiss()) {
      router.dismiss();
    }
    await handleSignOut();
  }, [handleSignOut, router]);

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
              saved={savedField === 'name'}
            />
            <View style={styles.divider} />
            <ProfileField
              label="Career background"
              placeholder="e.g. 6 years in software engineering"
              value={careerBackground}
              onChangeText={setCareerBackground}
              onBlur={() => saveField('careerBackground', careerBackground)}
              saved={savedField === 'careerBackground'}
            />
            <View style={styles.divider} />
            <ProfileField
              label="Goals"
              placeholder="What are you working towards?"
              value={goals}
              onChangeText={setGoals}
              onBlur={() => saveField('goals', goals)}
              saved={savedField === 'goals'}
              multiline
            />
            <View style={styles.divider} />
            <ProfileField
              label="About you"
              placeholder="Anything else Bob should know"
              value={bio}
              onChangeText={setBio}
              onBlur={() => saveField('bio', bio)}
              saved={savedField === 'bio'}
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

        <Pressable style={styles.feedbackButton} onPress={() => void handleFeedback()}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.amber[500]} />
          <Text style={styles.feedbackText}>Send feedback</Text>
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={() => void onSignOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Pressable style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </Pressable>

        <Text
          style={styles.version}
        >{`LaunchPad v${Application.nativeApplicationVersion ?? '1.0.0'}`}</Text>

        <View style={styles.legalLinks}>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                'https://www.notion.so/Privacy-Policy-31725e9f405780598782e0897aedfcee',
              )
            }
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>{'\u00B7'}</Text>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                'https://www.notion.so/Terms-of-Service-31725e9f40578070927fedcf0c115d84',
              )
            }
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
        </View>
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
  saved,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  multiline?: boolean;
  saved?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (saved === true) {
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [saved, opacity]);

  return (
    <View style={styles.profileField}>
      <View style={styles.profileFieldHeader}>
        <Text style={styles.profileFieldLabel}>{label}</Text>
        <Animated.Text style={[styles.savedIndicator, { opacity }]}>Saved</Animated.Text>
      </View>
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
  profileFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileFieldLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 13,
    color: colors.text.primary,
  },
  savedIndicator: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.amber[500],
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
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing['2xl'],
    marginTop: spacing['3xl'],
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.amber[300],
    backgroundColor: colors.amber[100],
  },
  feedbackText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: colors.amber[500],
  },
  signOutButton: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.lg,
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
  deleteAccountButton: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    textDecorationLine: 'underline',
  },
  version: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  legalLink: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.text.muted,
  },
});
