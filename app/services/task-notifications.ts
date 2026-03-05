import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NOTIF_MAP_KEY = 'launchpad_task_notif_map';

type NotifMap = Record<string, string>; // taskId -> notificationIdentifier

async function getNotifMap(): Promise<NotifMap> {
  const data = await AsyncStorage.getItem(NOTIF_MAP_KEY);
  if (data === null || data === '') return {};
  return JSON.parse(data) as NotifMap;
}

async function saveNotifMap(map: NotifMap): Promise<void> {
  await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map));
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: string,
): Promise<void> {
  const due = new Date(dueDate);
  const reminderTime = new Date(due.getTime() - 15 * 60 * 1000); // 15 min before
  const now = new Date();

  // Don't schedule if the reminder time has already passed
  if (reminderTime.getTime() <= now.getTime()) return;

  // Cancel any existing notification for this task
  await cancelTaskReminder(taskId);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task reminder',
      body: title,
      data: { type: 'task_reminder', taskId },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });

  const map = await getNotifMap();
  map[taskId] = identifier;
  await saveNotifMap(map);
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  const map = await getNotifMap();
  const identifier = map[taskId];
  if (identifier !== undefined) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    delete map[taskId];
    await saveNotifMap(map);
  }
}
