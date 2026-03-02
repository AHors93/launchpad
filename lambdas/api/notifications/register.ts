import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { registerPushSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const { pushToken } = registerPushSchema.parse(parseBody(event));

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET pushToken = :token',
      ExpressionAttributeValues: { ':token': pushToken },
    }),
  );

  return success({ registered: true });
});
