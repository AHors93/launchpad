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
  const convoId = getPathParam(event, 'convoId');

  // Verify conversation belongs to user
  const convoResult = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': `CONVO#${convoId}`,
      },
    }),
  );
  if (!convoResult.Items?.[0]) throw new ApiError(404, 'Conversation not found');

  // Fetch messages
  const messagesResult = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CONVO#${convoId}`,
        ':sk': 'MSG#',
      },
      ScanIndexForward: true,
    }),
  );

  const messages = (messagesResult.Items ?? []).map((item) => ({
    messageId: item.messageId as string,
    role: item.role as string,
    content: item.content as string,
    timestamp: item.timestamp as string,
  }));

  return success({ messages });
});
