import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, getQueryParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const statusFilter = getQueryParam(event, 'status');

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TASK#',
      },
    }),
  );

  let tasks = (result.Items || []) as Array<Record<string, unknown>>;
  if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
    tasks = tasks.filter((item) => item.status === statusFilter);
  }

  return success({ tasks });
});
