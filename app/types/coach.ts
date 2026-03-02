export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  ideaId?: string;
  messages: ChatMessage[];
  /** Server-side message count (available before messages are loaded in API mode) */
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}
