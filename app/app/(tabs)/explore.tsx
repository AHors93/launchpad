import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { ExploreResultCard } from '@/components/explore/ExploreResultCard';
import { useExploreSearch, useSearchHistory } from '@/hooks/useExplore';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { ExploreSearch } from '@/types/explore';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

const QUICK_PROMPTS = [
  'How do I become a software engineer?',
  "What's it like to run a coffee shop?",
  'Electrician apprenticeship UK',
  'Product manager career path',
  'Starting a food truck business',
  'Freelance graphic designer',
];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeResult, setActiveResult] = useState<ExploreSearch | undefined>(undefined);

  const inputRef = useRef<TextInput>(null);
  const { data: history } = useSearchHistory();
  const exploreSearch = useExploreSearch();

  const isSearching = exploreSearch.isPending;

  const handleSearch = useCallback(
    (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (q === '' || isSearching) return;

      Keyboard.dismiss();
      exploreSearch.mutate(q, {
        onSuccess: (result) => {
          hapticSuccess();
          setActiveResult(result);
          setQuery('');
        },
        onError: (error) => {
          Alert.alert('Search failed', error.message);
        },
      });
    },
    [query, isSearching, exploreSearch],
  );

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      hapticLight();
      setQuery(prompt);
      handleSearch(prompt);
    },
    [handleSearch],
  );

  const handleHistoryItem = useCallback((search: ExploreSearch) => {
    setActiveResult(search);
  }, []);

  const handleClearResult = useCallback(() => {
    setActiveResult(undefined);
    inputRef.current?.focus();
  }, []);

  const hasApiKey =
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== undefined &&
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover any career path</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.searchInput,
            { borderColor: focused ? colors.green[400] + '66' : colors.border.medium },
          ]}
          placeholder="What are you curious about?"
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={hasApiKey && !isSearching}
        />
        <Pressable
          style={[
            styles.searchButton,
            (query.trim() === '' || isSearching) && styles.searchButtonDisabled,
          ]}
          onPress={() => handleSearch()}
          disabled={query.trim() === '' || isSearching}
        >
          <Text style={styles.searchButtonText}>{isSearching ? '...' : 'Search'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!hasApiKey ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F511}'}</Text>
            <Text style={styles.emptyTitle}>API key needed</Text>
            <Text style={styles.emptyText}>
              {'Set EXPO_PUBLIC_ANTHROPIC_API_KEY\nin your .env to start exploring.'}
            </Text>
          </View>
        ) : isSearching ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingIcon}>{'\u{1F50D}'}</Text>
            <Text style={styles.loadingText}>Researching...</Text>
          </View>
        ) : activeResult !== undefined ? (
          <View>
            <Pressable onPress={handleClearResult} style={styles.backLink}>
              <Text style={styles.backLinkText}>{'\u2190'} New search</Text>
            </Pressable>
            <ExploreResultCard result={activeResult.result} />
          </View>
        ) : (
          <View>
            {/* Quick prompts */}
            <View style={styles.quickPromptsSection}>
              <Text style={styles.sectionLabel}>Try searching</Text>
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={styles.quickPrompt}
                    onPress={() => handleQuickPrompt(prompt)}
                  >
                    <Text style={styles.quickPromptText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recent searches */}
            {history !== undefined && history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionLabel}>Recent searches</Text>
                {history.map((search) => (
                  <Pressable
                    key={search.id}
                    style={styles.historyItem}
                    onPress={() => handleHistoryItem(search)}
                  >
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyQuery} numberOfLines={1}>
                        {search.query}
                      </Text>
                      <Text style={styles.historyResult} numberOfLines={1}>
                        {search.result.title}
                      </Text>
                    </View>
                    <Text style={styles.historyDate}>{formatDate(search.createdAt)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {(history === undefined || history.length === 0) && (
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
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 20,
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
    lineHeight: 20,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  searchButton: {
    backgroundColor: colors.green[400],
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.green[500],
    opacity: 0.5,
  },
  searchButtonText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  backLink: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.green[400],
  },
  quickPromptsSection: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickPrompt: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.green[400] + '33',
    backgroundColor: colors.green[400] + '0d',
  },
  quickPromptText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.green[400],
  },
  historySection: {
    paddingHorizontal: spacing['2xl'],
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  historyItemContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyQuery: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.primary,
  },
  historyResult: {
    fontFamily: fontFamily.display.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.muted,
    marginTop: 2,
  },
  historyDate: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
