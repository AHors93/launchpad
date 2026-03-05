import { randomUUID } from 'crypto';

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { createTaskSchema } from '@launchpad/shared';

import { dynamo, TABLE_NAME } from '../../shared/dynamo-client';
import { emitEvent } from '../../shared/eventbridge-client';
import { withErrorHandling, getUserId, parseBody, success } from '../../shared/middleware';

function calculateReminderDate(dueDate: string): string {
  const due = new Date(dueDate);
  due.setMinutes(due.getMinutes() - 15);
  return due.toISOString();
}

export const handler = withErrorHandling(async (event) => {
  const userId = getUserId(event);
  const input = createTaskSchema.parse(parseBody(event));
  const taskId = randomUUID();
  const now = new Date().toISOString();
  const reminderDate = calculateReminderDate(input.dueDate);

  const task = {
    PK: `USER#${userId}`,
    SK: `TASK#${taskId}`,
    taskId,
    userId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    reminderDate,
    linkedIdeaId: input.linkedIdeaId,
    status: 'pending',
    source: input.source,
    createdAt: now,
    updatedAt: now,
    GSI1PK: 'TASK_REMIND#pending',
    GSI1SK: `REMIND#${reminderDate}`,
  };

  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: task }));

  await emitEvent('launchpad.tasks', 'task.created', {
    userId,
    taskId,
    title: input.title,
    dueDate: input.dueDate,
    timestamp: now,
  });

  return success(
    {
      taskId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      reminderDate,
      linkedIdeaId: input.linkedIdeaId,
      status: 'pending',
      source: input.source,
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
});
