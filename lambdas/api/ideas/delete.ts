import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, getPathParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const ideaId = getPathParam(event, 'ideaId');

  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `IDEA#${ideaId}` },
    }),
  );

  return success({ deleted: true });
});
