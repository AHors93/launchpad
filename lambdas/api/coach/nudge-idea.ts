import { withErrorHandling, getUserId, getPathParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  getUserId(event); // auth check
  const ideaId = getPathParam(event, 'ideaId');

  // TODO: Phase 2 — Claude generates a nudge for a specific idea
  await Promise.resolve();
  return success({ message: 'Nudge integration coming in Phase 2', ideaId });
});
