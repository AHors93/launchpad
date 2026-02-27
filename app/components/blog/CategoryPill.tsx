import { Pressable, StyleSheet, Text } from 'react-native';

import { BLOG_CATEGORY_CONFIG } from '@/constants/blog';
import { colors, fontFamily, radius, spacing } from '@/theme/tokens';
import { BlogPostCategory } from '@/types/blog';

interface CategoryPillProps {
  category: BlogPostCategory;
  isActive?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ category, isActive = false, onPress }: CategoryPillProps) {
  const config = BLOG_CATEGORY_CONFIG.find((c) => c.value === category);
  if (config === undefined) return null;

  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      style={[
        styles.pill,
        {
          borderColor: isActive ? config.color : colors.border.medium,
          backgroundColor: isActive ? config.color + '22' : 'transparent',
        },
      ]}
    >
      <Text style={[styles.label, { color: isActive ? config.color : colors.text.muted }]}>
        {config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.mono.regular,
    fontSize: 12,
  },
});
