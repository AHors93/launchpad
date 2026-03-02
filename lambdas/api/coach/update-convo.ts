import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateConversationSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  parseBody,
  success,
} from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const convoId = getPathParam(event, 'convoId');
  const body = updateConversationSchema.parse(parseBody(event));

  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  if (body.linkedIdeaId !== undefined) {
    expressions.push('#lid = :lid');
    names['#lid'] = 'linkedIdeaId';
    values[':lid'] = body.linkedIdeaId;
  }

  if (expressions.length === 0) {
    return success({ updated: true });
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONVO#${convoId}` },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );

  return success({ updated: true });
});
