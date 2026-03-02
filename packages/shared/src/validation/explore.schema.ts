import { z } from 'zod';

export const exploreSearchSchema = z.object({
  query: z.string().min(1).max(500),
});

export const savePathSchema = z.object({
  title: z.string().min(1).max(200),
  query: z.string().min(1).max(500),
  summary: z.string().min(1).max(5000),
});

export type ExploreSearchInput = z.infer<typeof exploreSearchSchema>;
export type SavePathInput = z.infer<typeof savePathSchema>;
