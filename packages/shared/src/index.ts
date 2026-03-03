// Types
export type { Idea, IdeaNote, IdeaStatus, TrackType } from './types/idea';
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
  updateConversationSchema,
  extractIdeaSchema,
  type SendMessageInput,
  type CreateConversationInput,
  type UpdateConversationInput,
  type ExtractIdeaInput,
} from './validation/message.schema';
export {
  exploreSearchSchema,
  savePathSchema,
  type ExploreSearchInput,
  type SavePathInput,
} from './validation/explore.schema';
export {
  registerPushSchema,
  updateNotificationPrefsSchema,
  type RegisterPushInput,
  type UpdateNotificationPrefsInput,
} from './validation/notification.schema';
export { appleSignInSchema, type AppleSignInInput } from './validation/auth.schema';

// Constants
export { IDEA_STATUSES, STATUS_LABELS, STATUS_COLORS } from './constants/statuses';
export {
  TRACK_TYPES,
  TRACK_CONFIG,
  ALL_STATUSES,
  getTrackConfig,
  isValidStatusForTrack,
  getTerminalStatuses,
  type StatusConfig,
  type TrackConfig,
} from './constants/tracks';
export { IDEA_PROMPTS, COACH_SYSTEM_PROMPT } from './constants/prompts';
