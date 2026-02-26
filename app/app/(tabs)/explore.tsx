import { StyleSheet, Text, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, fonts, radius } from '@/theme/tokens';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover any career path</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="What are you curious about?"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🧭</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
