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
  createdAt: string;
  updatedAt: string;
}
