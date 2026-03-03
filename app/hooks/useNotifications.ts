import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { apiClient, isBackendConfigured } from '@/services/api';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus: string = existingStatus;

  if (finalStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'LaunchPad',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#b87028',
    });
  }

  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const eas = extra?.eas as Record<string, unknown> | undefined;
  const projectId = eas?.projectId as string | undefined;
  if (projectId === undefined || projectId === '') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data;
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void registerForPushNotifications().then((token) => {
      if (token !== null) {
        setPushToken(token);
      }
    });

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // Listen for when user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Could navigate to specific screen based on notification data
    });

    return () => {
      if (notificationListener.current !== null) {
        notificationListener.current.remove();
      }
      if (responseListener.current !== null) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Register push token with backend only when authenticated (endpoint requires auth)
  useEffect(() => {
    if (pushToken !== null && isAuthenticated && isBackendConfigured()) {
      void apiClient('/notifications/register', {
        method: 'POST',
        body: JSON.stringify({ pushToken }),
      }).catch(() => {
        // Ignore - will retry on next auth/login
      });
    }
  }, [pushToken, isAuthenticated]);

  return { pushToken, notification };
}

export interface NotificationPreferences {
  nudgesEnabled: boolean;
  staleIdeaReminders: boolean;
  coachFollowUps: boolean;
  careerPathUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  nudgesEnabled: true,
  staleIdeaReminders: true,
  coachFollowUps: true,
  careerPathUpdates: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (!isBackendConfigured()) return DEFAULT_PREFS;
  try {
    const data = await apiClient<{ preferences: Partial<NotificationPreferences> }>(
      '/notifications/settings',
    );
    return { ...DEFAULT_PREFS, ...data.preferences };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  if (!isBackendConfigured()) return;
  await apiClient('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(prefs),
  });
}
