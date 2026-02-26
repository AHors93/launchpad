export interface AuthUser {
  userId: string;
  email: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  needsConfirmation: boolean;
  confirmationEmail: string | null;
}
