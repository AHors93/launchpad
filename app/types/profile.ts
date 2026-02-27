export interface UserProfile {
  name: string;
  bio: string;
  interests: string[];
  careerBackground: string;
  goals: string;
}

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  bio: '',
  interests: [],
  careerBackground: '',
  goals: '',
};
