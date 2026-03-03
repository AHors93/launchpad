import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, getQueryParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const statusFilter = getQueryParam(event, 'status');
  const trackTypeFilter = getQueryParam(event, 'trackType');

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'IDEA#',
      },
    }),
  );

  const items = (result.Items || []) as Array<Record<string, unknown>>;
  let ideas = items.filter((item) => typeof item.SK === 'string' && !item.SK.includes('#NOTE#'));
  if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
    ideas = ideas.filter((item) => item.status === statusFilter);
  }
  if (trackTypeFilter !== null && trackTypeFilter !== undefined && trackTypeFilter !== '') {
    ideas = ideas.filter((item) => (item.trackType ?? 'side_project') === trackTypeFilter);
  }

  return success({ ideas });
});
