import { randomUUID } from 'crypto';

import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { emitEvent } from '../../shared/eventbridge-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const method = event.requestContext.http.method;

  if (method === 'GET') {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'PATH#' },
      }),
    );
    return success({ paths: result.Items || [] });
  }

  if (method === 'POST') {
    const { title, query, summary } = parseBody<{ title: string; query: string; summary: string }>(
      event,
    );
    const pathId = randomUUID();
    const now = new Date().toISOString();

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `PATH#${pathId}`,
          pathId,
          userId,
          title,
          query,
          summary,
          savedAt: now,
          GSI1PK: `EXPLORE#${title.toLowerCase().replace(/\s+/g, '-')}`,
          GSI1SK: `SAVED#${now}`,
        },
      }),
    );

    await emitEvent('launchpad.explore', 'explore.path_saved', {
      userId,
      pathId,
      query,
      title,
      timestamp: now,
    });

    return success({ pathId }, 201);
  }

  if (method === 'DELETE') {
    const pathId = event.pathParameters?.pathId;
    if (pathId !== null && pathId !== undefined && pathId !== '') {
      await dynamo.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: `PATH#${pathId}` },
        }),
      );
    }
    return success({ deleted: true });
  }

  return success({ error: 'Method not allowed' }, 405);
});
