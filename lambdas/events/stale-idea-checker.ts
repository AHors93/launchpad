import { randomUUID } from 'crypto';

import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { TRACK_CONFIG, getTrackConfig, getTerminalStatuses } from '@launchpad/shared';
import type { TrackType } from '@launchpad/shared';
import type { ScheduledEvent } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

// Collect all terminal statuses across all tracks for the scan filter
const allTerminalStatuses = Object.values(TRACK_CONFIG).flatMap((config) =>
  config.statuses.filter((s) => s.isTerminal).map((s) => s.value),
);
const uniqueTerminalStatuses = [...new Set(allTerminalStatuses)];

const STALE_MESSAGES: Record<string, Record<string, string>> = {
  side_project: {
    spark:
      'Your idea "{title}" has been sitting for a week. Even 10 minutes of exploration could change everything.',
    exploring: 'Still exploring "{title}"? Time to pick one small thing and start building.',
    building: '"{title}" hasn\'t moved in a week. What\'s blocking you? Even a tiny commit counts.',
  },
  job_application: {
    bookmarked: 'You bookmarked "{title}" a while ago. Worth applying before the role fills?',
    applied: 'Haven\'t heard back on "{title}"? Might be worth a follow-up.',
    interviewing: 'How\'s the interview process going for "{title}"?',
    offer: 'You\'ve got an offer from "{title}" — have you made a decision?',
  },
  career_pivot: {
    curious: 'Still curious about "{title}"? A quick bit of research could clarify things.',
    researching: 'How\'s the research going on "{title}"? Time to talk to someone in the field?',
    networking: 'Any good connections made for "{title}"? Keep the momentum going.',
    transitioning: '"{title}" transition has stalled. What\'s the next concrete step?',
  },
  course: {
    interested: 'Still interested in "{title}"? Application deadlines don\'t wait.',
    applied: 'Any updates on your "{title}" application?',
    enrolled: 'You\'re enrolled in "{title}" — have you started yet?',
    completing: 'Keep going with "{title}" — you\'re nearly there.',
  },
  freelance: {
    lead: '"{title}" lead is going cold. Time to reach out?',
    pitched: 'Haven\'t heard back on your "{title}" pitch? A follow-up might help.',
    negotiating: 'How are negotiations going for "{title}"?',
    active: '"{title}" hasn\'t had an update in a while. Everything on track?',
  },
  custom: {
    to_do: '"{title}" is still on your to-do list. Ready to start?',
    in_progress: '"{title}" hasn\'t moved recently. What\'s the hold-up?',
  },
};

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  try {
    // Scan for all non-terminal ideas
    const filterParts = uniqueTerminalStatuses.map((_, i) => `#status <> :terminal${i}`);
    const filterExpression = `begins_with(SK, :sk) AND ${filterParts.join(' AND ')}`;
    const expressionValues: Record<string, string> = { ':sk': 'IDEA#' };
    uniqueTerminalStatuses.forEach((s, i) => {
      expressionValues[`:terminal${i}`] = s;
    });

    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: expressionValues,
      }),
    );

    const ideas = (result.Items ?? []) as Array<{
      PK: string;
      ideaId: string;
      userId: string;
      title: string;
      status: string;
      trackType?: string;
      updatedAt: string;
    }>;

    const now = new Date().toISOString();

    for (const idea of ideas) {
      const trackType = (idea.trackType ?? 'side_project') as TrackType;
      const trackConfig = getTrackConfig(trackType);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - trackConfig.staleThresholdDays);
      const cutoffIso = cutoffDate.toISOString();

      // Skip if not stale yet
      if (idea.updatedAt >= cutoffIso) continue;

      // Skip terminal statuses (belt and braces)
      const terminalStatuses = getTerminalStatuses(trackType) as string[];
      if (terminalStatuses.includes(idea.status)) continue;

      const userId = idea.PK.replace('USER#', '');
      const nudgeId = randomUUID();

      const trackMessages = STALE_MESSAGES[trackType] ?? {};
      const content =
        trackMessages[idea.status]?.replace('{title}', idea.title) ??
        `Remember "${idea.title}"? It's been a while.`;

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
            trackType,
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
