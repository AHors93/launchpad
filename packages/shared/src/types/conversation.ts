export type ConversationMode = 'idea' | 'career' | 'general';

export interface Conversation {
  convoId: string;
  userId: string;
  title: string;
  mode: ConversationMode;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  linkedIdeaId?: string;
}

export type MessageRole = 'user' | 'assistant';

export interface Message {
  convoId: string;
  messageId: string;
  userId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}
