import { withErrorHandling, getUserId, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  getUserId(event); // auth check

  // TODO: Phase 3 — AI-generated suggestions based on user interests
  await Promise.resolve();
  return success({ suggestions: [] });
});
