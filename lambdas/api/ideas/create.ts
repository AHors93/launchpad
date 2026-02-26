import { randomUUID } from 'crypto';

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { createIdeaSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { emitEvent } from '../../shared/eventbridge-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const input = createIdeaSchema.parse(parseBody(event));
  const ideaId = randomUUID();
  const now = new Date().toISOString();

  const idea = {
    PK: `USER#${userId}`,
    SK: `IDEA#${ideaId}`,
    ideaId,
    userId,
    title: input.title,
    description: input.description,
    status: 'spark' as const,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'STATUS#spark',
    GSI1SK: `UPDATED#${now}`,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: idea }));

  await emitEvent('launchpad.ideas', 'idea.created', {
    userId,
    ideaId,
    title: input.title,
    timestamp: now,
  });

  return success(
    {
      ideaId,
      title: input.title,
      status: 'spark',
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
});
