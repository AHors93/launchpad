import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { ScheduledEvent } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + 2 * 60 * 60 * 1000); // now + 2 hours
    const horizonIso = horizon.toISOString();

    // Query GSI1 for pending tasks whose reminder date is within the next 2 hours
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK <= :sk',
        ExpressionAttributeValues: {
          ':pk': 'TASK_REMIND#pending',
          ':sk': `REMIND#${horizonIso}`,
        },
      }),
    );

    const tasks = (result.Items ?? []) as Array<{
      PK: string;
      taskId: string;
      userId: string;
      title: string;
      dueDate: string;
    }>;

    for (const task of tasks) {
      const userId = task.PK.replace('USER#', '');

      await emitEvent('launchpad.tasks', 'task.reminder', {
        userId,
        taskId: task.taskId,
        title: task.title,
        dueDate: task.dueDate,
        timestamp: now.toISOString(),
      });
    }
  } catch (err) {
    console.error('Task reminder check failed:', err);
  }
};
