import { randomUUID } from 'crypto';

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { createConversationSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const input = createConversationSchema.parse(parseBody(event));
  const convoId = randomUUID();
  const now = new Date().toISOString();

  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `CONVO#${convoId}`,
        convoId,
        userId,
        title: 'New conversation',
        mode: input.mode,
        startedAt: now,
        lastMessageAt: now,
        messageCount: 0,
        linkedIdeaId: input.linkedIdeaId,
      },
    }),
  );

  return success({ convoId }, 201);
});
