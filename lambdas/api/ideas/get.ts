import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  success,
  ApiError,
} from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const ideaId = getPathParam(event, 'ideaId');

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': `IDEA#${ideaId}`,
      },
    }),
  );

  const items = result.Items || [];
  const idea = items.find((i) => i.SK === `IDEA#${ideaId}`);
  if (!idea) throw new ApiError(404, 'Idea not found');

  const notes = items.filter((i) => {
    const sk = (i as Record<string, unknown>).SK;
    return typeof sk === 'string' && sk.includes('#NOTE#');
  });

  return success({ ...idea, notes });
});
