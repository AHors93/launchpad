import { z } from 'zod';

export const registerPushSchema = z.object({
  pushToken: z.string().min(1).max(500),
});

export const updateNotificationPrefsSchema = z.object({
  nudges: z.boolean().optional(),
  staleReminders: z.boolean().optional(),
  actionItems: z.boolean().optional(),
});

export type RegisterPushInput = z.infer<typeof registerPushSchema>;
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;
