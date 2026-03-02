import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CategoryPill } from '@/components/blog/CategoryPill';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { BlogPost } from '@/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  commentCount: number;
  index: number;
  onPress: (postId: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BlogPostCard({ post, commentCount, index, onPress }: BlogPostCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable style={styles.card} onPress={() => onPress(post.postId)}>
        <View style={styles.topRow}>
          <CategoryPill category={post.category} isActive />
          <Text style={styles.readTime}>{post.readTimeMinutes} min read</Text>
        </View>

        {post.imageUri !== undefined && (
          <Image source={{ uri: post.imageUri }} style={styles.cardImage} />
        )}

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {post.excerpt}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatDate(post.publishedAt)}</Text>
          <Text style={styles.comments}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  readTime: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  excerpt: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  comments: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
});
