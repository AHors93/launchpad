import { randomUUID } from 'crypto';

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { createIdeaSchema, getTrackConfig } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const input = createIdeaSchema.parse(parseBody(event));
  const ideaId = randomUUID();
  const now = new Date().toISOString();
  const trackType = input.trackType ?? 'side_project';
  const trackConfig = getTrackConfig(trackType);
  const status = trackConfig.defaultStatus;

  const idea = {
    PK: `USER#${userId}`,
    SK: `IDEA#${ideaId}`,
    ideaId,
    userId,
    title: input.title,
    description: input.description,
    status,
    trackType,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
    GSI1PK: `STATUS#${trackType}#${status}`,
    GSI1SK: `UPDATED#${now}`,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: idea }));

  return success(
    {
      ideaId,
      title: input.title,
      description: input.description,
      status,
      trackType,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
});
