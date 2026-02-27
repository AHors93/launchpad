import { colors } from '@/theme/tokens';
import { BlogPostCategory } from '@/types/blog';

export const BLOG_POSTS_STORAGE_KEY = 'launchpad_blog_posts';
export const BLOG_COMMENTS_STORAGE_KEY = 'launchpad_blog_comments';

export const BLOG_CATEGORY_CONFIG: {
  value: BlogPostCategory;
  label: string;
  color: string;
}[] = [
  { value: 'update', label: 'Update', color: colors.amber[500] },
  { value: 'idea', label: 'Idea', color: colors.purple[400] },
  { value: 'devlog', label: 'Dev Log', color: colors.blue[400] },
  { value: 'reflection', label: 'Reflection', color: colors.green[400] },
];
