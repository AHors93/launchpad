export interface BaseEvent {
  userId: string;
  timestamp: string;
}

export interface IdeaCreatedEvent extends BaseEvent {
  ideaId: string;
  title: string;
}

export interface IdeaStatusChangedEvent extends BaseEvent {
  ideaId: string;
  previousStatus: string;
  newStatus: string;
}

export interface StaleCheckEvent {
  timestamp: string;
}

export interface ConversationIdleEvent extends BaseEvent {
  convoId: string;
  messageCount: number;
}

export interface PathSavedEvent extends BaseEvent {
  pathId: string;
  query: string;
  title: string;
}

export type LaunchpadEvent =
  | { source: 'launchpad.ideas'; detailType: 'idea.created'; detail: IdeaCreatedEvent }
  | { source: 'launchpad.ideas'; detailType: 'idea.status_changed'; detail: IdeaStatusChangedEvent }
  | { source: 'launchpad.scheduler'; detailType: 'idea.stale_check'; detail: StaleCheckEvent }
  | {
      source: 'launchpad.coach';
      detailType: 'coach.conversation_idle';
      detail: ConversationIdleEvent;
    }
  | { source: 'launchpad.explore'; detailType: 'explore.path_saved'; detail: PathSavedEvent };
