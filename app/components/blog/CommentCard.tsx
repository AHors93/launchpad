import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { BlogComment } from '@/types/blog';

interface CommentCardProps {
  comment: BlogComment;
  isOwn: boolean;
  onDelete?: (commentId: string) => void;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function CommentCard({ comment, isOwn, onDelete }: CommentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{comment.authorName}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.time}>{timeAgo(comment.createdAt)}</Text>
          {isOwn && onDelete !== undefined && (
            <Pressable onPress={() => onDelete(comment.commentId)} hitSlop={8}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={styles.content}>{comment.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    backgroundColor: colors.bg.surfacePressed,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  author: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 12,
    color: colors.primary[500],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  time: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.text.muted,
  },
  delete: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    color: colors.red[400],
  },
  content: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
  },
});
