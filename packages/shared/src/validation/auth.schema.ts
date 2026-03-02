import { z } from 'zod';

export const appleSignInSchema = z.object({
  identityToken: z.string().min(1),
  fullName: z
    .object({
      givenName: z.string().nullable().optional(),
      familyName: z.string().nullable().optional(),
    })
    .optional(),
});

export type AppleSignInInput = z.infer<typeof appleSignInSchema>;
