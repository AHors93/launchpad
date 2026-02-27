import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EncouragementBanner } from '@/components/EncouragementBanner';
import { GradientBackground } from '@/components/GradientBackground';
import { AddIdeaSheet } from '@/components/ideas/AddIdeaSheet';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { StatsRow } from '@/components/ideas/StatsRow';
import {
  useCreateIdea,
  useDeleteIdea,
  useIdeas,
  useIdeaStats,
  useUpdateIdea,
} from '@/hooks/useIdeas';
import { colors, fontFamily, spacing } from '@/theme/tokens';
import { Idea, IdeaStatus } from '@/types/idea';

const EMPTY_STATS = { total: 0, spark: 0, exploring: 0, building: 0, shipped: 0 };

function ListHeader({ stats, onSettings }: { stats: typeof EMPTY_STATS; onSettings: () => void }) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.brandLabel}>LaunchPad</Text>
          <Pressable onPress={onSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color={colors.text.muted} />
          </Pressable>
        </View>
        <Text style={styles.tagline}>Stop thinking. Start making.</Text>
        <Text style={styles.subtitle}>
          Your ideas deserve more than a notes app. Your career deserves more than wondering.
        </Text>
      </View>

      <EncouragementBanner />
      <StatsRow stats={stats} />
    </View>
  );
}

export default function IdeasScreen() {
  const router = useRouter();
  const { data: ideas, isLoading, refetch } = useIdeas();
  const { data: stats } = useIdeaStats();
  const createIdea = useCreateIdea();
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();
  const sheetRef = useRef<BottomSheet>(null);

  const handleOpenSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleOpenSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
  }, []);

  const handleCreateIdea = useCallback(
    (title: string) => {
      createIdea.mutate({ title });
    },
    [createIdea],
  );

  const handleStatusChange = useCallback(
    (ideaId: string, status: IdeaStatus) => {
      updateIdea.mutate({ ideaId, updates: { status } });
    },
    [updateIdea],
  );

  const handleDeleteIdea = useCallback(
    (ideaId: string) => {
      deleteIdea.mutate(ideaId);
    },
    [deleteIdea],
  );

  const renderItem = useCallback(
    ({ item }: { item: Idea }) => (
      <IdeaCard idea={item} onStatusChange={handleStatusChange} onDelete={handleDeleteIdea} />
    ),
    [handleStatusChange, handleDeleteIdea],
  );

  const keyExtractor = useCallback((item: Idea) => item.ideaId, []);

  const resolvedStats = stats ?? EMPTY_STATS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />
      {ideas === undefined || ideas === null || ideas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ListHeader stats={resolvedStats} onSettings={handleOpenSettings} />
          {!isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u{1F4A1}'}</Text>
              <Text style={styles.emptyTitle}>No ideas yet</Text>
              <Text style={styles.emptyText}>
                {
                  "That's fine \u2014 everyone starts with zero.\nDrop your first one below, even if it's half-baked."
                }
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={ideas}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={<ListHeader stats={resolvedStats} onSettings={handleOpenSettings} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refetch()}
              tintColor={colors.amber[500]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable style={styles.fab} onPress={handleOpenSheet}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddIdeaSheet ref={sheetRef} onSubmit={handleCreateIdea} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  emptyContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    padding: spacing.xs,
  },
  brandLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 20,
    lineHeight: 28,
    color: colors.amber[500],
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  tagline: {
    fontFamily: fontFamily.display.bold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.amber[500],
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.display.regular,
    fontSize: 20,
    lineHeight: 30,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: spacing['3xl'],
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
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.amber[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: colors.text.inverse,
    fontWeight: '600',
    lineHeight: 30,
  },
});
