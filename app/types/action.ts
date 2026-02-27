export type ActionType = 'email' | 'calendar' | 'maps' | 'link';

export interface EmailAction {
  type: 'email';
  to: string;
  subject: string;
  body: string;
}

export interface CalendarAction {
  type: 'calendar';
  title: string;
  notes?: string;
  startDate?: string;
  location?: string;
}

export interface MapsAction {
  type: 'maps';
  query: string;
}

export interface LinkAction {
  type: 'link';
  url: string;
  label: string;
}

export type BobAction = EmailAction | CalendarAction | MapsAction | LinkAction;

export interface ParsedMessage {
  text: string;
  actions: BobAction[];
}
