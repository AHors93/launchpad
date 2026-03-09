export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  createdAt: string;
  onboardingComplete: boolean;
  pushToken?: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  staleIdeaReminders: boolean;
  coachFollowUps: boolean;
}
