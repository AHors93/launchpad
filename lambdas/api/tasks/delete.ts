import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { emitEvent } from '../../shared/eventbridge-client';
import { withErrorHandling, getUserId, getPathParam, success } from '../../shared/middleware';

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const taskId = getPathParam(event, 'taskId');

  await dynamo.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `TASK#${taskId}` },
    }),
  );

  await emitEvent('launchpad.tasks', 'task.deleted', {
    userId,
    taskId,
    timestamp: new Date().toISOString(),
  });

  return success({ deleted: true });
});
