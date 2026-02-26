import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  getUserId(event); // auth check
  const { query } = parseBody<{ query: string }>(event);

  // TODO: Phase 3 — Claude + web search
  await Promise.resolve();
  return success({ message: 'Explore search coming in Phase 3', query });
});
