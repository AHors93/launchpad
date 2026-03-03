import { z } from 'zod';

import { ALL_STATUSES, TRACK_TYPES, isValidStatusForTrack } from '../constants/tracks';
import type { IdeaStatus, TrackType } from '../types/idea';

export const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  trackType: z.enum(TRACK_TYPES).optional(),
});

export const updateIdeaSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(ALL_STATUSES).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    trackType: z.enum(TRACK_TYPES).optional(),
  })
  .refine(
    (data) => {
      if (data.status !== undefined && data.trackType !== undefined) {
        return isValidStatusForTrack(data.status as IdeaStatus, data.trackType as TrackType);
      }
      return true;
    },
    { message: 'Status is not valid for the specified track type' },
  );

export const addNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['note', 'step', 'action_item']).default('note'),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
