export type NudgeType =
  | 'idea_created'
  | 'status_changed'
  | 'stale_idea'
  | 'action_item'
  | 'career_checkin';

export interface Nudge {
  userId: string;
  timestamp: string;
  type: NudgeType;
  content: string;
  ideaId?: string;
  read: boolean;
  pushSent: boolean;
}
