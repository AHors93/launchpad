import { z } from 'zod';

import { IDEA_STATUSES } from '../constants/statuses';

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(IDEA_STATUSES).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const addNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['note', 'step', 'action_item']).default('note'),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
