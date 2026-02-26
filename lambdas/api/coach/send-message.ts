import { sendMessageSchema } from '@launchpad/shared';

import {
  withErrorHandling,
  getUserId,
  getPathParam,
  parseBody,
  success,
} from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  getUserId(event); // auth check
  const convoId = getPathParam(event, 'convoId');
  const input = sendMessageSchema.parse(parseBody(event));

  // TODO: Phase 2 — Claude API integration
  await Promise.resolve();
  return success({
    message: 'Coach integration coming in Phase 2',
    convoId,
    received: input.content,
  });
});
