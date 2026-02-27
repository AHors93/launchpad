import { randomUUID } from 'crypto';

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import type { EventBridgeEvent } from 'aws-lambda';

import { getClaudeClient } from '../shared/claude-client';
import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

interface IdeaEventDetail {
  userId: string;
  ideaId: string;
  title: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
}

interface PathEventDetail {
  userId: string;
  pathId: string;
  query: string;
  title: string;
  timestamp: string;
}

type EventDetail = IdeaEventDetail | PathEventDetail;

const NUDGE_PROMPT = `Generate a short, encouraging push notification message (max 100 characters) for a user of a career/idea tracking app. The tone should be warm, direct, and motivating — like a supportive friend. No emojis.`;

export const handler = async (event: EventBridgeEvent<string, EventDetail>): Promise<void> => {
  const detail = event.detail;
  const detailType = event['detail-type'];

  let prompt: string;
  let nudgeType: string;
  let ideaId: string | undefined;

  if (detailType === 'idea.created') {
    const d = detail as IdeaEventDetail;
    prompt = `The user just added a new idea called "${d.title}". Generate a nudge celebrating this and encouraging them to flesh it out.`;
    nudgeType = 'idea_created';
    ideaId = d.ideaId;
  } else if (detailType === 'idea.status_changed') {
    const d = detail as IdeaEventDetail;
    prompt = `The user just moved their idea "${d.title}" from "${d.previousStatus ?? 'unknown'}" to "${d.newStatus ?? 'unknown'}". Generate a nudge celebrating this progress.`;
    nudgeType = 'status_changed';
    ideaId = d.ideaId;
  } else if (detailType === 'explore.path_saved') {
    const d = detail as PathEventDetail;
    prompt = `The user just saved a career path: "${d.title}" (searched: "${d.query}"). Generate a nudge encouraging them to explore it further or take a first step.`;
    nudgeType = 'career_checkin';
  } else {
    return;
  }

  try {
    const claude = await getClaudeClient();
    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: NUDGE_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (textBlock === undefined || textBlock.type !== 'text') return;

    const now = new Date().toISOString();
    const nudgeId = randomUUID();

    // Store the nudge
    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${detail.userId}`,
          SK: `NUDGE#${now}#${nudgeId}`,
          nudgeId,
          userId: detail.userId,
          type: nudgeType,
          content: textBlock.text,
          ideaId,
          read: false,
          pushSent: false,
          timestamp: now,
        },
      }),
    );

    // Emit event for notification-sender to pick up
    await emitEvent('launchpad.nudges', 'nudge.created', {
      userId: detail.userId,
      nudgeId,
      content: textBlock.text,
      type: nudgeType,
      timestamp: now,
    });
  } catch (err) {
    console.error('Nudge generation failed:', err);
  }
};
