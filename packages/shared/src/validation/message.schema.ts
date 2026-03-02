import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const createConversationSchema = z.object({
  mode: z.enum(['idea', 'career', 'general']).default('general'),
  linkedIdeaId: z.string().optional(),
  initialMessage: z.string().min(1).max(10000).optional(),
});

export const updateConversationSchema = z.object({
  linkedIdeaId: z.string().min(1).optional(),
});

export const extractIdeaSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ExtractIdeaInput = z.infer<typeof extractIdeaSchema>;
