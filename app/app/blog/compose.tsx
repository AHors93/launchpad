import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/GradientBackground';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { BLOG_CATEGORY_CONFIG } from '@/constants/blog';
import { useCreatePost } from '@/hooks/useBlog';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { BlogPostCategory } from '@/types/blog';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

export default function ComposePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<BlogPostCategory>('update');

  const canPublish = title.trim() !== '' && body.trim() !== '';

  const handlePublish = useCallback(() => {
    if (!canPublish) return;
    hapticSuccess();
    createPost.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        excerpt: excerpt.trim() !== '' ? excerpt.trim() : body.trim().substring(0, 150) + '...',
        category,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [canPublish, title, body, excerpt, category, createPost, router]);

  const handleBack = useCallback(() => {
    if (title.trim() !== '' || body.trim() !== '') {
      Alert.alert('Discard post?', 'Your draft will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [title, body, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GradientBackground />

      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>New post</Text>
        <Pressable
          onPress={handlePublish}
          disabled={!canPublish || createPost.isPending}
          style={[styles.publishButton, !canPublish && styles.publishButtonDisabled]}
        >
          <Text style={[styles.publishText, !canPublish && styles.publishTextDisabled]}>
            Publish
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {BLOG_CATEGORY_CONFIG.map((cat) => (
            <CategoryPill
              key={cat.value}
              category={cat.value}
              isActive={category === cat.value}
              onPress={() => {
                hapticLight();
                setCategory(cat.value);
              }}
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Post title"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        <Text style={styles.fieldLabel}>Excerpt (optional)</Text>
        <TextInput
          style={styles.excerptInput}
          placeholder="Short preview for the feed — auto-generated if left blank"
          placeholderTextColor={colors.text.muted}
          value={excerpt}
          onChangeText={setExcerpt}
          multiline
          maxLength={200}
        />

        <Text style={styles.fieldLabel}>Body</Text>
        <TextInput
          style={styles.bodyInput}
          placeholder="Write your post..."
          placeholderTextColor={colors.text.muted}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
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
  topBarTitle: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 16,
    color: colors.text.primary,
  },
  publishButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.amber[500],
    borderRadius: radius.lg,
  },
  publishButtonDisabled: {
    backgroundColor: colors.amber[200],
  },
  publishText: {
    fontFamily: fontFamily.mono.bold,
    fontSize: 13,
    color: colors.text.inverse,
  },
  publishTextDisabled: {
    color: colors.text.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  fieldLabel: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  titleInput: {
    fontFamily: fontFamily.display.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  excerptInput: {
    fontFamily: fontFamily.display.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 60,
  },
  bodyInput: {
    fontFamily: fontFamily.display.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.primary,
    backgroundColor: colors.bg.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 200,
  },
});
