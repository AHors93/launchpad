import { BatchWriteCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, getPathParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const convoId = getPathParam(event, 'convoId');

  // Delete conversation metadata
  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `CONVO#${convoId}` },
    }),
  );

  // Query all messages for this conversation
  const messagesResult = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CONVO#${convoId}`,
        ':sk': 'MSG#',
      },
    }),
  );

  // Delete messages in batches of 25 (DynamoDB limit)
  const items = messagesResult.Items ?? [];
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await dynamo.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            DeleteRequest: {
              Key: { PK: item.PK as string, SK: item.SK as string },
            },
          })),
        },
      }),
    );
  }

  return success({ deleted: true });
});
