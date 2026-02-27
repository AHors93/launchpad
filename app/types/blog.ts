export type BlogPostCategory = 'update' | 'idea' | 'devlog' | 'reflection';

export interface BlogPost {
  postId: string;
  title: string;
  body: string;
  excerpt: string;
  category: BlogPostCategory;
  publishedAt: string;
  readTimeMinutes: number;
}

export interface BlogComment {
  commentId: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt: string;
}
