export type ActionType = 'email' | 'calendar' | 'maps' | 'link' | 'save_idea' | 'create_task';

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

export interface SaveIdeaAction {
  type: 'save_idea';
  title: string;
  description?: string;
}

export interface CreateTaskAction {
  type: 'create_task';
  title: string;
  dueDate: string;
  description?: string;
  linkedIdeaId?: string;
}

export type BobAction =
  | EmailAction
  | CalendarAction
  | MapsAction
  | LinkAction
  | SaveIdeaAction
  | CreateTaskAction;

export interface ParsedMessage {
  text: string;
  actions: BobAction[];
}
