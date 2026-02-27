import { randomUUID } from 'crypto';

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { EventBridgeEvent } from 'aws-lambda';

import { getClaudeClient } from '../shared/claude-client';
import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

interface ConversationIdleDetail {
  userId: string;
  convoId: string;
  messageCount: number;
  timestamp: string;
}

const EXTRACTION_PROMPT = `Based on this coaching conversation, extract 1-2 concrete action items the user should do next. Return a single short sentence (max 120 chars) summarising the most important next step. No JSON, no bullet points — just the sentence.`;

export const handler = async (
  event: EventBridgeEvent<'coach.conversation_idle', ConversationIdleDetail>,
): Promise<void> => {
  const { userId, convoId } = event.detail;

  try {
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

    if (messages.length < 2) return;

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
    if (textBlock === undefined || textBlock.type !== 'text') return;

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

    await emitEvent('launchpad.nudges', 'nudge.created', {
      userId,
      nudgeId,
      content: textBlock.text,
      type: 'action_item',
      timestamp: now,
    });
  } catch (err) {
    console.error('Action item extraction failed:', err);
  }
};
