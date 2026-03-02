import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateNotificationPrefsSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const method = event.requestContext.http.method;

  if (method === 'GET') {
    const result = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
        ProjectionExpression: 'notificationPreferences',
      }),
    );
    const prefs = result.Item?.notificationPreferences as Record<string, boolean> | undefined;
    const preferences: Record<string, boolean> =
      prefs !== null && prefs !== undefined && typeof prefs === 'object' && !Array.isArray(prefs)
        ? prefs
        : {};
    return success({ preferences });
  }

  const preferences = updateNotificationPrefsSchema.parse(parseBody(event));
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      UpdateExpression: 'SET notificationPreferences = :prefs',
      ExpressionAttributeValues: { ':prefs': preferences },
    }),
  );

  return success({ updated: true });
});
