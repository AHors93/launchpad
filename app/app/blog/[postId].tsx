import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { CommentCard } from '@/components/blog/CommentCard';
import { CommentInput } from '@/components/blog/CommentInput';
import {
  useBlogPost,
  useCreateComment,
  useDeleteComment,
  useDeletePost,
  usePostComments,
} from '@/hooks/useBlog';
import { useProfile } from '@/hooks/useProfile';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { hapticLight, hapticSuccess, hapticWarning } from '@/utils/haptics';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { data: post } = useBlogPost(postId);
  const { data: comments } = usePostComments(postId ?? '');
  const { data: profile } = useProfile();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const deletePost = useDeletePost();

  const resolvedComments = useMemo(() => comments ?? [], [comments]);
  const authorName = profile?.name ?? '';

  const handleSubmitComment = useCallback(
    (content: string) => {
      if (postId === undefined) return;
      hapticSuccess();
      createComment.mutate({ postId, content, authorName });
    },
    [postId, authorName, createComment],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      hapticWarning();
      deleteComment.mutate(commentId);
    },
    [deleteComment],
  );

  const handleDeletePost = useCallback(() => {
    if (postId === undefined) return;
    hapticWarning();
    Alert.alert('Delete post?', "This will also remove all comments. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost.mutate(postId, { onSuccess: () => router.back() });
        },
      },
    ]);
  }, [postId, deletePost, router]);

  if (post === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GradientBackground />
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>{'\u{1F4DD}'}</Text>
          <Text style={styles.notFoundTitle}>Post not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.notFoundBack}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            hapticLight();
            router.back();
          }}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={handleDeletePost} style={styles.deleteButton} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={colors.red[400]} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.meta}>
          <CategoryPill category={post.category} isActive />
          <Text style={styles.metaText}>
            {formatDate(post.publishedAt)} {'\u00B7'} {post.readTimeMinutes} min read
          </Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.author}>by Adam</Text>

        {post.imageUri !== undefined && (
          <Image source={{ uri: post.imageUri }} style={styles.postImage} />
        )}

        <Text style={styles.body}>{post.body}</Text>

        <View style={styles.divider} />

        <Text style={styles.commentsTitle}>Comments ({resolvedComments.length})</Text>

        {resolvedComments.length === 0 ? (
          <View style={styles.noComments}>
            <Text style={styles.noCommentsText}>Be the first to share your thoughts</Text>
          </View>
        ) : (
          resolvedComments.map((comment) => (
            <CommentCard
              key={comment.commentId}
              comment={comment}
              isOwn={comment.authorName === (authorName !== '' ? authorName : 'Anonymous')}
              onDelete={handleDeleteComment}
            />
          ))
        )}

        <CommentInput onSubmit={handleSubmitComment} isSubmitting={createComment.isPending} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  author: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: spacing['2xl'],
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    marginBottom: spacing['2xl'],
  },
  body: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing['3xl'],
  },
  commentsTitle: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  noComments: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
  },
  noCommentsText: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 13,
    color: colors.text.muted,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  notFoundTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  notFoundBack: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 14,
    color: colors.primary[500],
  },
});
