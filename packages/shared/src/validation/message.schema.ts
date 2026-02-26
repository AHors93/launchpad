import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const createConversationSchema = z.object({
  mode: z.enum(['idea', 'career', 'general']).default('general'),
  linkedIdeaId: z.string().optional(),
  initialMessage: z.string().min(1).max(10000).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
