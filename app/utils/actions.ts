import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';
import * as MailComposer from 'expo-mail-composer';
import { Alert, Platform } from 'react-native';

import { BobAction, ParsedMessage } from '@/types/action';

// ── Parser ───────────────────────────────────────────────────

const ACTION_REGEX = /\[ACTION:(\w+)\]([\s\S]*?)\[\/ACTION\]/g;

export function parseMessage(content: string): ParsedMessage {
  const actions: BobAction[] = [];
  const text = content
    .replace(ACTION_REGEX, (_match, type: string, json: string) => {
      try {
        const data = JSON.parse(json.trim()) as Record<string, string>;
        switch (type) {
          case 'email':
            actions.push({
              type: 'email',
              to: data.to ?? '',
              subject: data.subject ?? '',
              body: data.body ?? '',
            });
            break;
          case 'calendar':
            actions.push({
              type: 'calendar',
              title: data.title ?? '',
              notes: data.notes,
              startDate: data.startDate,
              location: data.location,
            });
            break;
          case 'maps':
            actions.push({
              type: 'maps',
              query: data.query ?? '',
            });
            break;
          case 'link':
            actions.push({
              type: 'link',
              url: data.url ?? '',
              label: data.label ?? 'Open link',
            });
            break;
        }
      } catch (e) {
        console.warn('Malformed action block:', json, e);
      }
      return '';
    })
    .trim();

  return { text, actions };
}

// ── Executors ────────────────────────────────────────────────

export function getActionLabel(action: BobAction): string {
  switch (action.type) {
    case 'email':
      return `Draft email${action.to !== '' ? ` to ${action.to}` : ''}`;
    case 'calendar':
      return `Add "${action.title}" to calendar`;
    case 'maps':
      return `Open "${action.query}" in maps`;
    case 'link':
      return action.label;
  }
}

export function getActionIcon(action: BobAction): string {
  switch (action.type) {
    case 'email':
      return '\u{2709}\u{FE0F}';
    case 'calendar':
      return '\u{1F4C5}';
    case 'maps':
      return '\u{1F4CD}';
    case 'link':
      return '\u{1F517}';
  }
}

export async function executeAction(action: BobAction): Promise<void> {
  switch (action.type) {
    case 'email':
      return executeEmail(action);
    case 'calendar':
      return executeCalendar(action);
    case 'maps':
      return executeMaps(action);
    case 'link':
      return executeLink(action);
  }
}

async function executeEmail(action: { to: string; subject: string; body: string }): Promise<void> {
  const isAvailable = await MailComposer.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Mail not available', 'No mail account is set up on this device.');
    return;
  }
  await MailComposer.composeAsync({
    recipients: action.to !== '' ? [action.to] : [],
    subject: action.subject,
    body: action.body,
  });
}

async function executeCalendar(action: {
  title: string;
  notes?: string;
  startDate?: string;
  location?: string;
}): Promise<void> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== Calendar.PermissionStatus.GRANTED) {
    Alert.alert('Permission needed', 'Calendar access is required to create events.');
    return;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar =
    Platform.OS === 'ios'
      ? (calendars.find((c) => c.source.name === 'Default') ?? calendars[0])
      : (calendars.find((c) => c.allowsModifications) ?? calendars[0]);

  if (defaultCalendar === undefined) {
    Alert.alert('No calendar found', 'Could not find a calendar to add the event to.');
    return;
  }

  const start = action.startDate !== undefined ? new Date(action.startDate) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour

  await Calendar.createEventAsync(defaultCalendar.id, {
    title: action.title,
    notes: action.notes,
    startDate: start,
    endDate: end,
    location: action.location,
  });

  Alert.alert('Event created', `"${action.title}" has been added to your calendar.`);
}

async function executeMaps(action: { query: string }): Promise<void> {
  const encoded = encodeURIComponent(action.query);
  const url = Platform.OS === 'ios' ? `maps:0,0?q=${encoded}` : `geo:0,0?q=${encoded}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback to Google Maps web
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  }
}

async function executeLink(action: { url: string }): Promise<void> {
  const canOpen = await Linking.canOpenURL(action.url);
  if (canOpen) {
    await Linking.openURL(action.url);
  } else {
    Alert.alert('Cannot open link', action.url);
  }
}
