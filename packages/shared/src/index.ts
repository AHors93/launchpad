// Types
export type { Idea, IdeaNote, IdeaStatus } from './types/idea';
export type { Conversation, Message, MessageRole, ConversationMode } from './types/conversation';
export type { SavedPath, SearchResult, PathSuggestion } from './types/explore';
export type { UserProfile, NotificationPreferences } from './types/user';
export type { Nudge, NudgeType } from './types/nudge';
export type {
  BaseEvent,
  IdeaCreatedEvent,
  IdeaStatusChangedEvent,
  StaleCheckEvent,
  ConversationIdleEvent,
  PathSavedEvent,
  LaunchpadEvent,
} from './types/events';

// Validation schemas
export {
  createIdeaSchema,
  updateIdeaSchema,
  addNoteSchema,
  type CreateIdeaInput,
  type UpdateIdeaInput,
  type AddNoteInput,
} from './validation/idea.schema';
export {
  sendMessageSchema,
  createConversationSchema,
  type SendMessageInput,
  type CreateConversationInput,
} from './validation/message.schema';

// Constants
export { IDEA_STATUSES, STATUS_LABELS, STATUS_COLORS } from './constants/statuses';
export { IDEA_PROMPTS, COACH_SYSTEM_PROMPT } from './constants/prompts';
