import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateTaskSchema } from '@launchpad/shared';

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

function calculateReminderDate(dueDate: string): string {
  const due = new Date(dueDate);
  due.setMinutes(due.getMinutes() - 15);
  return due.toISOString();
}

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const taskId = getPathParam(event, 'taskId');
  const input = updateTaskSchema.parse(parseBody(event));
  const now = new Date().toISOString();

  // Get current task to detect changes
  const current = await dynamo.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${userId}`, SK: `TASK#${taskId}` } }),
  );
  if (!current.Item) throw new ApiError(404, 'Task not found');

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

  const statusChanged = input.status !== undefined && input.status !== current.Item.status;
  const dueDateChanged = input.dueDate !== undefined && input.dueDate !== current.Item.dueDate;

  if (input.dueDate !== undefined) {
    updates.push('#dueDate = :dueDate');
    names['#dueDate'] = 'dueDate';
    values[':dueDate'] = input.dueDate;
  }

  if (input.status !== undefined) {
    updates.push('#status = :status');
    names['#status'] = 'status';
    values[':status'] = input.status;
  }

  // Update GSI1 based on status and dueDate changes
  const finalStatus = (input.status as string | undefined) ?? (current.Item.status as string);
  const finalDueDate = input.dueDate ?? (current.Item.dueDate as string);

  if (statusChanged || dueDateChanged) {
    const reminderDate = calculateReminderDate(finalDueDate);

    updates.push('#reminderDate = :reminderDate');
    names['#reminderDate'] = 'reminderDate';
    values[':reminderDate'] = reminderDate;

    // If task is completed/dismissed, move it out of the pending remind partition
    if (finalStatus === 'done' || finalStatus === 'dismissed') {
      updates.push('GSI1PK = :gsi1pk', 'GSI1SK = :gsi1sk');
      values[':gsi1pk'] = `TASK_REMIND#${finalStatus}`;
      values[':gsi1sk'] = `REMIND#${reminderDate}`;
    } else {
      updates.push('GSI1PK = :gsi1pk', 'GSI1SK = :gsi1sk');
      values[':gsi1pk'] = 'TASK_REMIND#pending';
      values[':gsi1sk'] = `REMIND#${reminderDate}`;
    }
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `TASK#${taskId}` },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );

  if (statusChanged) {
    await emitEvent('launchpad.tasks', 'task.updated', {
      userId,
      taskId,
      previousStatus: current.Item.status,
      newStatus: input.status,
      timestamp: now,
    });
  }

  return success({ updated: true });
});
