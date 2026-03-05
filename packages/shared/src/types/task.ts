export type TaskStatus = 'pending' | 'done' | 'dismissed';

export type TaskSource = 'bob' | 'manual';

export interface Task {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  reminderDate: string;
  linkedIdeaId?: string;
  status: TaskStatus;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
}
