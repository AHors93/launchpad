import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { useBlogPosts, useCommentCounts } from '@/hooks/useBlog';
import { colors, fontFamily, spacing } from '@/theme/tokens';
import { BlogPost } from '@/types/blog';
import { hapticMedium } from '@/utils/haptics';

export default function BlogFeedScreen() {
  const router = useRouter();
  const { data: posts } = useBlogPosts();
  const { data: commentCounts } = useCommentCounts();

  const resolvedPosts = useMemo(() => posts ?? [], [posts]);
  const resolvedCounts = useMemo(() => commentCounts ?? {}, [commentCounts]);

  const handlePostPress = useCallback(
    (postId: string) => {
      router.push(`/blog/${postId}`);
    },
    [router],
  );

  const handleCompose = useCallback(() => {
    hapticMedium();
    router.push('/blog/compose');
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: { item: BlogPost; index: number }) => (
      <BlogPostCard
        post={item}
        commentCount={resolvedCounts[item.postId] ?? 0}
        index={index}
        onPress={handlePostPress}
      />
    ),
    [resolvedCounts, handlePostPress],
  );

  const keyExtractor = useCallback((item: BlogPost) => item.postId, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>From Adam</Text>
          <Text style={styles.screenSubtitle}>Updates, ideas, and honest reflections</Text>
        </View>
      </View>

      <FlatList
        data={resolvedPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F4DD}'}</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Tap + to write your first post</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={handleCompose}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    paddingTop: spacing.xs,
    paddingRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
  },
  screenSubtitle: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
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
