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

export const handler = async (
  event: EventBridgeEvent<'nudge.created', NudgeCreatedDetail>,
): Promise<void> => {
  const { userId, nudgeId, content, timestamp } = event.detail;

  try {
    // Get user profile for push token and notification preferences
    const profileResult = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      }),
    );

    const profile = profileResult.Item as
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

    if (profile === undefined || profile.pushToken === undefined || profile.pushToken === '') {
      return;
    }

    // Check if notifications are enabled for this type
    const prefs = profile.notificationPreferences;
    const nudgeType = event.detail.type;
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

    // Send push notification via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: profile.pushToken,
        title: 'LaunchPad',
        body: content,
        data: { nudgeId, type: nudgeType },
        sound: 'default',
      }),
    });

    if (response.ok) {
      // Mark nudge as push sent
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `NUDGE#${timestamp}#${nudgeId}`,
          },
          UpdateExpression: 'SET pushSent = :sent',
          ExpressionAttributeValues: { ':sent': true },
        }),
      );
    } else {
      const body = await response.text();
      console.error('Expo push failed:', body);
    }
  } catch (err) {
    console.error('Notification send failed:', err);
  }
};
