import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';

export default function ExploreScreen() {
  const [focused, setFocused] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover any career path</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { borderColor: focused ? colors.amber[300] : colors.border.medium },
          ]}
          placeholder="What are you curious about?"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Pressable style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{'\u{1F9ED}'}</Text>
        <Text style={styles.emptyTitle}>Search anything</Text>
        <Text style={styles.emptyText}>
          {'"How do I become an electrician?"'}
          {'\n'}
          {'"What\'s it like to run a bakery?"'}
          {'\n'}
          {'"UX researcher salary UK"'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  searchButton: {
    backgroundColor: colors.green[400],
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
