export type IdeaStatus = 'spark' | 'exploring' | 'building' | 'shipped';

export interface Idea {
  ideaId: string;
  title: string;
  description?: string;
  status: IdeaStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IdeaNote {
  ideaId: string;
  timestamp: string;
  content: string;
  type: 'note' | 'step' | 'action_item';
  source: 'user' | 'coach';
}
