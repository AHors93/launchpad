import { randomUUID } from 'crypto';

import { PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { ScheduledEvent } from 'aws-lambda';

import { getClaudeClient } from '../shared/claude-client';
import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

const IDLE_DAYS = 3;

const EXTRACTION_PROMPT = `Based on this coaching conversation, extract 1-2 concrete action items the user should do next. Return a single short sentence (max 120 chars) summarising the most important next step. No JSON, no bullet points — just the sentence.`;

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - IDLE_DAYS);
    const cutoffIso = cutoff.toISOString();

    // Scan for conversations with lastMessageAt older than 3 days
    // that haven't already been nudged since their last activity
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          'begins_with(SK, :sk) AND #lma < :cutoff AND (attribute_not_exists(actionItemNudgedAt) OR actionItemNudgedAt < #lma)',
        ExpressionAttributeNames: { '#lma': 'lastMessageAt' },
        ExpressionAttributeValues: {
          ':sk': 'CONVO#',
          ':cutoff': cutoffIso,
        },
      }),
    );

    const conversations = (result.Items ?? []) as Array<{
      PK: string;
      SK: string;
      lastMessageAt: string;
      messageCount?: number;
    }>;

    for (const convo of conversations) {
      const userId = convo.PK.replace('USER#', '');
      const convoId = convo.SK.replace('CONVO#', '');
      const messageCount = convo.messageCount ?? 0;

      if (messageCount < 2) continue;

      // Load conversation messages
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

      const messages = (messagesResult.Items ?? []) as Array<{
        role: string;
        content: string;
      }>;

      if (messages.length < 2) continue;

      const conversationText = messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
        .join('\n\n');

      const claude = await getClaudeClient();
      const response = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: EXTRACTION_PROMPT,
        messages: [{ role: 'user', content: conversationText }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock === undefined || textBlock.type !== 'text') continue;

      const now = new Date().toISOString();
      const nudgeId = randomUUID();

      await dynamo.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `NUDGE#${now}#${nudgeId}`,
            nudgeId,
            userId,
            type: 'action_item',
            content: textBlock.text,
            read: false,
            pushSent: false,
            timestamp: now,
          },
        }),
      );

      // Mark conversation as nudged so we don't re-nudge until new activity
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: convo.PK, SK: convo.SK },
          UpdateExpression: 'SET actionItemNudgedAt = :now',
          ExpressionAttributeValues: { ':now': now },
        }),
      );

      await emitEvent('launchpad.nudges', 'nudge.created', {
        userId,
        nudgeId,
        content: textBlock.text,
        type: 'action_item',
        timestamp: now,
      });
    }
  } catch (err) {
    console.error('Action item extraction failed:', err);
  }
};
