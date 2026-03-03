export type TrackType =
  | 'side_project'
  | 'job_application'
  | 'career_pivot'
  | 'course'
  | 'freelance'
  | 'custom';

export type IdeaStatus =
  | 'spark'
  | 'exploring'
  | 'building'
  | 'shipped'
  | 'bookmarked'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'curious'
  | 'researching'
  | 'networking'
  | 'transitioning'
  | 'landed'
  | 'interested'
  | 'enrolled'
  | 'completing'
  | 'completed'
  | 'lead'
  | 'pitched'
  | 'negotiating'
  | 'active'
  | 'delivered'
  | 'to_do'
  | 'in_progress'
  | 'done';

export interface Idea {
  ideaId: string;
  title: string;
  description?: string;
  status: IdeaStatus;
  trackType?: TrackType;
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
