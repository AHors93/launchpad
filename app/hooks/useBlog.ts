import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

import { BLOG_COMMENTS_STORAGE_KEY, BLOG_POSTS_STORAGE_KEY } from '@/constants/blog';
import { BlogComment, BlogPost, BlogPostCategory } from '@/types/blog';

const blogKeys = {
  posts: ['blog-posts'] as const,
  comments: ['blog-comments'] as const,
};

// ── Storage helpers ──────────────────────────────────────────

async function loadPosts(): Promise<BlogPost[]> {
  const data = await AsyncStorage.getItem(BLOG_POSTS_STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as BlogPost[];
}

async function savePosts(posts: BlogPost[]): Promise<void> {
  await AsyncStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(posts));
}

async function loadComments(): Promise<BlogComment[]> {
  const data = await AsyncStorage.getItem(BLOG_COMMENTS_STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as BlogComment[];
}

async function saveComments(comments: BlogComment[]): Promise<void> {
  await AsyncStorage.setItem(BLOG_COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}

// ── Post queries ─────────────────────────────────────────────

export function useBlogPosts() {
  return useQuery({
    queryKey: blogKeys.posts,
    queryFn: loadPosts,
  });
}

export function useBlogPost(postId: string | undefined) {
  return useQuery({
    queryKey: blogKeys.posts,
    queryFn: loadPosts,
    select: (posts) => posts.find((p) => p.postId === postId),
    enabled: postId !== undefined && postId !== '',
  });
}

// ── Comment queries ──────────────────────────────────────────

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: blogKeys.comments,
    queryFn: loadComments,
    select: (comments) =>
      comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
}

export function useCommentCounts() {
  return useQuery({
    queryKey: blogKeys.comments,
    queryFn: loadComments,
    select: (comments) => {
      const counts: Record<string, number> = {};
      for (const c of comments) {
        counts[c.postId] = (counts[c.postId] ?? 0) + 1;
      }
      return counts;
    },
  });
}

// ── Post mutations ───────────────────────────────────────────

function estimateReadTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      body,
      excerpt,
      category,
    }: {
      title: string;
      body: string;
      excerpt: string;
      category: BlogPostCategory;
    }) => {
      const posts = await loadPosts();
      const now = new Date().toISOString();
      const newPost: BlogPost = {
        postId: Crypto.randomUUID(),
        title,
        body,
        excerpt,
        category,
        publishedAt: now,
        readTimeMinutes: estimateReadTime(body),
      };
      posts.unshift(newPost);
      await savePosts(posts);
      return newPost;
    },
    onMutate: async ({ title, body, excerpt, category }) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.posts });
      const previous = queryClient.getQueryData<BlogPost[]>(blogKeys.posts);
      const now = new Date().toISOString();
      const optimistic: BlogPost = {
        postId: `temp-${Date.now()}`,
        title,
        body,
        excerpt,
        category,
        publishedAt: now,
        readTimeMinutes: estimateReadTime(body),
      };
      queryClient.setQueryData<BlogPost[]>(blogKeys.posts, (old) => [optimistic, ...(old ?? [])]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(blogKeys.posts, context.previous);
      }
      Alert.alert('Error', 'Failed to publish post. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.posts });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const [posts, comments] = await Promise.all([loadPosts(), loadComments()]);
      const filteredPosts = posts.filter((p) => p.postId !== postId);
      const filteredComments = comments.filter((c) => c.postId !== postId);
      await Promise.all([savePosts(filteredPosts), saveComments(filteredComments)]);
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.posts });
      await queryClient.cancelQueries({ queryKey: blogKeys.comments });
      const previousPosts = queryClient.getQueryData<BlogPost[]>(blogKeys.posts);
      const previousComments = queryClient.getQueryData<BlogComment[]>(blogKeys.comments);
      queryClient.setQueryData<BlogPost[]>(blogKeys.posts, (old) =>
        (old ?? []).filter((p) => p.postId !== postId),
      );
      queryClient.setQueryData<BlogComment[]>(blogKeys.comments, (old) =>
        (old ?? []).filter((c) => c.postId !== postId),
      );
      return { previousPosts, previousComments };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts !== undefined) {
        queryClient.setQueryData(blogKeys.posts, context.previousPosts);
      }
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(blogKeys.comments, context.previousComments);
      }
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.posts });
      void queryClient.invalidateQueries({ queryKey: blogKeys.comments });
    },
  });
}

// ── Comment mutations ────────────────────────────────────────

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      authorName,
    }: {
      postId: string;
      content: string;
      authorName: string;
    }) => {
      const comments = await loadComments();
      const newComment: BlogComment = {
        commentId: Crypto.randomUUID(),
        postId,
        content,
        authorName: authorName !== '' ? authorName : 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      comments.unshift(newComment);
      await saveComments(comments);
      return newComment;
    },
    onMutate: async ({ postId, content, authorName }) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.comments });
      const previous = queryClient.getQueryData<BlogComment[]>(blogKeys.comments);
      const optimistic: BlogComment = {
        commentId: `temp-${Date.now()}`,
        postId,
        content,
        authorName: authorName !== '' ? authorName : 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<BlogComment[]>(blogKeys.comments, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(blogKeys.comments, context.previous);
      }
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.comments });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const comments = await loadComments();
      const filtered = comments.filter((c) => c.commentId !== commentId);
      await saveComments(filtered);
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.comments });
      const previous = queryClient.getQueryData<BlogComment[]>(blogKeys.comments);
      queryClient.setQueryData<BlogComment[]>(blogKeys.comments, (old) =>
        (old ?? []).filter((c) => c.commentId !== commentId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(blogKeys.comments, context.previous);
      }
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.comments });
    },
  });
}
