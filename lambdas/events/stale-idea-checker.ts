import { randomUUID } from 'crypto';

import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { ScheduledEvent } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

const STALE_DAYS = 7;

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - STALE_DAYS);
  const cutoffIso = cutoffDate.toISOString();

  try {
    // Scan for ideas that haven't been updated in STALE_DAYS
    // In production, a GSI on updatedAt would be more efficient
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(SK, :sk) AND updatedAt < :cutoff AND #status <> :shipped',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':sk': 'IDEA#',
          ':cutoff': cutoffIso,
          ':shipped': 'shipped',
        },
      }),
    );

    const staleIdeas = (result.Items ?? []) as Array<{
      PK: string;
      ideaId: string;
      userId: string;
      title: string;
      status: string;
    }>;

    const now = new Date().toISOString();

    for (const idea of staleIdeas) {
      const userId = idea.PK.replace('USER#', '');
      const nudgeId = randomUUID();

      const messages: Record<string, string> = {
        spark: `Your idea "${idea.title}" has been sitting for a week. Even 10 minutes of exploration could change everything.`,
        exploring: `Still exploring "${idea.title}"? Time to pick one small thing and start building.`,
        building: `"${idea.title}" hasn't moved in a week. What's blocking you? Even a tiny commit counts.`,
      };

      const content = messages[idea.status] ?? `Remember "${idea.title}"? It's been a while.`;

      await dynamo.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `NUDGE#${now}#${nudgeId}`,
            nudgeId,
            userId,
            type: 'stale_idea',
            content,
            ideaId: idea.ideaId,
            read: false,
            pushSent: false,
            timestamp: now,
          },
        }),
      );

      await emitEvent('launchpad.nudges', 'nudge.created', {
        userId,
        nudgeId,
        content,
        type: 'stale_idea',
        timestamp: now,
      });
    }
  } catch (err) {
    console.error('Stale idea check failed:', err);
  }
};
