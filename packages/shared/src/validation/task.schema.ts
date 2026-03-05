import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime(),
  linkedIdeaId: z.string().uuid().optional(),
  source: z.enum(['bob', 'manual']).default('manual'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'done', 'dismissed']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
