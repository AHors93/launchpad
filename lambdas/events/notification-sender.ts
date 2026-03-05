import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { EventBridgeEvent } from 'aws-lambda';

import { dynamo, TABLE_NAME } from '../shared/dynamo-client';

interface NudgeCreatedDetail {
  userId: string;
  nudgeId: string;
  content: string;
  type: string;
  timestamp: string;
}

interface TaskReminderDetail {
  userId: string;
  taskId: string;
  title: string;
  dueDate: string;
  timestamp: string;
}

type EventDetail = NudgeCreatedDetail | TaskReminderDetail;

async function getProfile(userId: string) {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
    }),
  );
  return result.Item as
    | {
        pushToken?: string;
        notificationPreferences?: {
          nudgesEnabled?: boolean;
          staleIdeaReminders?: boolean;
          coachFollowUps?: boolean;
          careerPathUpdates?: boolean;
        };
      }
    | undefined;
}

async function sendPush(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<boolean> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.error('Expo push failed:', responseBody);
    return false;
  }
  return true;
}

async function handleNudge(detail: NudgeCreatedDetail, pushToken: string): Promise<void> {
  const sent = await sendPush(pushToken, 'LaunchPad', detail.content, {
    nudgeId: detail.nudgeId,
    type: detail.type,
  });

  if (sent) {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${detail.userId}`,
          SK: `NUDGE#${detail.timestamp}#${detail.nudgeId}`,
        },
        UpdateExpression: 'SET pushSent = :sent',
        ExpressionAttributeValues: { ':sent': true },
      }),
    );
  }
}

async function handleTaskReminder(detail: TaskReminderDetail, pushToken: string): Promise<void> {
  const due = new Date(detail.dueDate);
  const timeStr = due.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const body = `${detail.title} — due at ${timeStr}`;

  const sent = await sendPush(pushToken, 'Task reminder', body, {
    type: 'task_reminder',
    taskId: detail.taskId,
  });

  if (sent) {
    // Move task off the reminder index so it doesn't fire again
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${detail.userId}`,
          SK: `TASK#${detail.taskId}`,
        },
        UpdateExpression: 'SET GSI1PK = :pk, GSI1SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'TASK_REMIND#sent',
          ':sk': `REMIND#${detail.dueDate}`,
        },
      }),
    );
  }
}

export const handler = async (event: EventBridgeEvent<string, EventDetail>): Promise<void> => {
  const { userId } = event.detail;

  try {
    const profile = await getProfile(userId);
    if (profile === undefined || profile.pushToken === undefined || profile.pushToken === '') {
      return;
    }

    if (event['detail-type'] === 'task.reminder') {
      const detail = event.detail as TaskReminderDetail;
      await handleTaskReminder(detail, profile.pushToken);
      return;
    }

    // Nudge handling
    const detail = event.detail as NudgeCreatedDetail;
    const prefs = profile.notificationPreferences;
    const nudgeType = detail.type;

    if (prefs !== undefined) {
      if (nudgeType === 'stale_idea' && prefs.staleIdeaReminders === false) return;
      if (nudgeType === 'action_item' && prefs.coachFollowUps === false) return;
      if (nudgeType === 'career_checkin' && prefs.careerPathUpdates === false) return;
      if (
        (nudgeType === 'idea_created' || nudgeType === 'status_changed') &&
        prefs.nudgesEnabled === false
      ) {
        return;
      }
    }

    await handleNudge(detail, profile.pushToken);
  } catch (err) {
    console.error('Notification send failed:', err);
  }
};
