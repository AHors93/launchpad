import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

const DEFAULT_PREFS: NotificationPreferences = {
  nudgesEnabled: true,
  staleIdeaReminders: true,
  coachFollowUps: true,
  careerPathUpdates: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { handleSignOut, user, isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    void getNotificationPreferences().then(setPrefs);
  }, []);

  const togglePref = useCallback(
    (key: keyof NotificationPreferences) => {
      const updated = { ...prefs, [key]: !prefs[key] };
      setPrefs(updated);
      void updateNotificationPreferences({ [key]: updated[key] });
    },
    [prefs],
  );

  const onSignOut = useCallback(async () => {
    await handleSignOut();
    router.replace('/(auth)/sign-in');
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

      {isAuthenticated && user !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      )}

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
            label="Coach follow-ups"
            desc="Action items from coaching conversations"
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

      {isAuthenticated && (
        <Pressable style={styles.signOutButton} onPress={() => void onSignOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      )}

      <Text style={styles.version}>LaunchPad v1.0.0</Text>
    </SafeAreaView>
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
