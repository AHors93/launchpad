import { withErrorHandling, getUserId, getPathParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  getUserId(event); // auth check
  const pathId = getPathParam(event, 'pathId');

  // TODO: Phase 3 — Claude + web search refresh
  await Promise.resolve();
  return success({ message: 'Path refresh coming in Phase 3', pathId });
});
