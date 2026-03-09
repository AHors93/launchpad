import { randomUUID } from 'crypto';

import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TRACK_CONFIG, getTerminalStatuses } from '@launchpad/shared';
import type { TrackType } from '@launchpad/shared';
import type { ScheduledEvent } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../shared/dynamo-client';
import { emitEvent } from '../shared/eventbridge-client';

// Collect all terminal statuses across all tracks for the scan filter
const allTerminalStatuses = Object.values(TRACK_CONFIG).flatMap((config) =>
  config.statuses.filter((s) => s.isTerminal).map((s) => s.value),
);
const uniqueTerminalStatuses = [...new Set(allTerminalStatuses)];

/** Day-3 messages: gentle, warm nudge */
const GENTLE_MESSAGES: Record<string, Record<string, string>> = {
  side_project: {
    spark:
      '"{title}" has been sitting for a few days. Even 5 minutes of thinking could unlock something.',
    exploring:
      'Still mulling over "{title}"? Sometimes a quick note is all it takes to keep moving.',
    building: '"{title}" hasn\'t moved in a few days. What\'s one tiny thing you could do today?',
  },
  job_application: {
    bookmarked: 'You bookmarked "{title}" a few days ago. Still interested?',
    applied: '"{title}" — worth a quick check on the status?',
    interviewing: 'How\'s "{title}" going? Any prep you could do today?',
    offer: 'You\'ve got an offer from "{title}" — take a moment to think it through.',
  },
  career_pivot: {
    curious: 'Still curious about "{title}"? A quick bit of reading could help.',
    researching: '"{title}" research — even 10 minutes today keeps it alive.',
    networking: 'Any connections to reach out to for "{title}"?',
    transitioning: '"{title}" — what\'s the smallest next step?',
  },
  course: {
    interested: 'Still thinking about "{title}"? Worth a quick look at deadlines.',
    applied: 'Any news on "{title}"?',
    enrolled: '"{title}" — have you had a chance to get started?',
    completing: 'Keep going with "{title}" — you\'re making progress.',
  },
  freelance: {
    lead: '"{title}" — worth a quick follow-up?',
    pitched: 'Any response on "{title}" yet?',
    negotiating: '"{title}" negotiations — anything to move forward on?',
    active: '"{title}" hasn\'t had an update recently. Everything OK?',
  },
  custom: {
    to_do: '"{title}" is still on your list. Ready to start?',
    in_progress: '"{title}" — what\'s next?',
  },
};

/** Day-7 messages: more direct, encouraging action */
const BIGGER_MESSAGES: Record<string, Record<string, string>> = {
  side_project: {
    spark:
      '"{title}" has been a spark for a week now. Time to explore it or let it go — both are valid.',
    exploring: '"{title}" — a week of exploring. Pick one small thing and start building.',
    building: '"{title}" hasn\'t moved in a week. What\'s blocking you? Even a tiny commit counts.',
  },
  job_application: {
    bookmarked:
      '"{title}" has been bookmarked for a week. Apply or archive — don\'t let it linger.',
    applied: 'A week since you applied to "{title}". Follow up or move on.',
    interviewing: '"{title}" interview process — a week without updates. Chase it up.',
    offer: '"{title}" offer has been sitting for a week. Time to decide.',
  },
  career_pivot: {
    curious: 'A week of being curious about "{title}". Time to do some real research.',
    researching: '"{title}" — a week of research. Talk to someone in the field.',
    networking: '"{title}" networking has stalled for a week. Reach out to someone new.',
    transitioning: '"{title}" transition hasn\'t moved in a week. What\'s the concrete next step?',
  },
  course: {
    interested: '"{title}" — it\'s been a week. Check deadlines before it\'s too late.',
    applied: 'A week since applying to "{title}". Follow up if you haven\'t heard back.',
    enrolled: 'You\'ve been enrolled in "{title}" for a week. Time to dive in.',
    completing: '"{title}" — don\'t lose momentum now. You\'re nearly there.',
  },
  freelance: {
    lead: '"{title}" lead has gone cold — a week without action. Reach out now.',
    pitched: 'A week since pitching "{title}". Follow up — silence isn\'t always a no.',
    negotiating: '"{title}" negotiations stalled for a week. Push for a decision.',
    active: '"{title}" hasn\'t had an update in a week. Check in with the client.',
  },
  custom: {
    to_do: '"{title}" has been on your to-do list for a week. Time to start or remove it.',
    in_progress: '"{title}" hasn\'t moved in a week. What\'s holding you up?',
  },
};

const GENTLE_DAYS = 3;
const BIGGER_DAYS = 7;

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
      staleTier?: number;
    }>;

    const now = new Date();
    const gentleCutoff = new Date(now);
    gentleCutoff.setDate(gentleCutoff.getDate() - GENTLE_DAYS);
    const biggerCutoff = new Date(now);
    biggerCutoff.setDate(biggerCutoff.getDate() - BIGGER_DAYS);

    for (const idea of ideas) {
      const trackType = (idea.trackType ?? 'side_project') as TrackType;
      const currentTier = idea.staleTier ?? 0;

      // Skip terminal statuses (belt and braces)
      const terminalStatuses = getTerminalStatuses(trackType) as string[];
      if (terminalStatuses.includes(idea.status)) continue;

      let targetTier: number | null = null;
      let messages: Record<string, Record<string, string>>;

      if (currentTier < 2 && idea.updatedAt < biggerCutoff.toISOString()) {
        targetTier = 2;
        messages = BIGGER_MESSAGES;
      } else if (currentTier < 1 && idea.updatedAt < gentleCutoff.toISOString()) {
        targetTier = 1;
        messages = GENTLE_MESSAGES;
      } else {
        continue;
      }

      const userId = idea.PK.replace('USER#', '');
      const nudgeId = randomUUID();
      const timestamp = now.toISOString();

      const trackMessages = messages[trackType] ?? {};
      const content =
        trackMessages[idea.status]?.replace('{title}', idea.title) ??
        (targetTier === 1
          ? `"${idea.title}" hasn't moved in a few days. Worth a quick look?`
          : `"${idea.title}" has been sitting for a week. What's the next step?`);

      // Store the nudge
      await dynamo.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `NUDGE#${timestamp}#${nudgeId}`,
            nudgeId,
            userId,
            type: 'stale_idea',
            content,
            ideaId: idea.ideaId,
            trackType,
            read: false,
            pushSent: false,
            timestamp,
          },
        }),
      );

      // Update the idea's stale tier so we don't send the same tier again
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: idea.PK, SK: `IDEA#${idea.ideaId}` },
          UpdateExpression: 'SET staleTier = :tier',
          ExpressionAttributeValues: { ':tier': targetTier },
        }),
      );

      // Emit for notification-sender to push
      await emitEvent('launchpad.nudges', 'nudge.created', {
        userId,
        nudgeId,
        content,
        type: 'stale_idea',
        timestamp,
      });
    }
  } catch (err) {
    console.error('Stale idea check failed:', err);
  }
};
