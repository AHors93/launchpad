import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateIdeaSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { emitEvent } from '../../shared/eventbridge-client';
import {
  withErrorHandling,
  getUserId,
  getPathParam,
  parseBody,
  success,
  ApiError,
} from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const ideaId = getPathParam(event, 'ideaId');
  const input = updateIdeaSchema.parse(parseBody(event));
  const now = new Date().toISOString();

  // Get current idea for status change detection
  const current = await dynamo.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${userId}`, SK: `IDEA#${ideaId}` } }),
  );
  if (!current.Item) throw new ApiError(404, 'Idea not found');

  const updates: string[] = ['#updatedAt = :now'];
  const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
  const values: Record<string, unknown> = { ':now': now };

  if (input.title !== undefined) {
    updates.push('#title = :title');
    names['#title'] = 'title';
    values[':title'] = input.title;
  }
  if (input.description !== undefined) {
    updates.push('#desc = :desc');
    names['#desc'] = 'description';
    values[':desc'] = input.description;
  }
  if (input.status !== undefined) {
    updates.push('#status = :status', 'GSI1PK = :gsi1pk', 'GSI1SK = :gsi1sk');
    names['#status'] = 'status';
    values[':status'] = input.status;
    values[':gsi1pk'] = `STATUS#${input.status}`;
    values[':gsi1sk'] = `UPDATED#${now}`;
  }
  if (input.tags !== undefined) {
    updates.push('#tags = :tags');
    names['#tags'] = 'tags';
    values[':tags'] = input.tags;
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `IDEA#${ideaId}` },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );

  if (input.status && input.status !== current.Item.status) {
    await emitEvent('launchpad.ideas', 'idea.status_changed', {
      userId,
      ideaId,
      previousStatus: current.Item.status,
      newStatus: input.status,
      timestamp: now,
    });
  }

  return success({ updated: true });
});
