import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CONVO#',
      },
      ScanIndexForward: false,
    }),
  );

  return success({ conversations: result.Items || [] });
});
