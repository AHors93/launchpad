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
  nudgesEnabled: boolean;
  staleIdeaReminders: boolean;
  coachFollowUps: boolean;
  careerPathUpdates: boolean;
}
