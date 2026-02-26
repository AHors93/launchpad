import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AuthState, AuthUser } from '@/types/auth';

interface AuthContextValue extends AuthState {
  handleSignIn: (email: string, password: string) => Promise<void>;
  handleSignUp: (email: string, password: string) => Promise<void>;
  handleConfirmSignUp: (email: string, code: string) => Promise<void>;
  handleResendCode: (email: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    needsConfirmation: false,
    confirmationEmail: null,
  });

  // Check if user is already signed in
  useEffect(() => {
    void checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const cognitoUser = await getCurrentUser();
      const user: AuthUser = {
        userId: cognitoUser.userId,
        email: cognitoUser.signInDetails?.loginId ?? '',
      };
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        needsConfirmation: false,
        confirmationEmail: null,
      });
    } catch {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        needsConfirmation: false,
        confirmationEmail: null,
      });
    }
  }

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      const cognitoUser = await getCurrentUser();
      setState({
        isLoading: false,
        isAuthenticated: true,
        user: { userId: cognitoUser.userId, email },
        needsConfirmation: false,
        confirmationEmail: null,
      });
    } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      setState((prev) => ({
        ...prev,
        needsConfirmation: true,
        confirmationEmail: email,
      }));
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const result = await signUp({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
    if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      setState((prev) => ({
        ...prev,
        needsConfirmation: true,
        confirmationEmail: email,
      }));
    }
  }, []);

  const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
    const result = await confirmSignUp({ username: email, confirmationCode: code });
    if (result.isSignUpComplete) {
      // Clear confirmation state — user needs to sign in
      setState((prev) => ({
        ...prev,
        needsConfirmation: false,
        confirmationEmail: null,
      }));
    }
  }, []);

  const handleResendCode = useCallback(async (email: string) => {
    await resendSignUpCode({ username: email });
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      needsConfirmation: false,
      confirmationEmail: null,
    });
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      handleSignIn,
      handleSignUp,
      handleConfirmSignUp,
      handleResendCode,
      handleSignOut,
      getToken,
    }),
    [
      state,
      handleSignIn,
      handleSignUp,
      handleConfirmSignUp,
      handleResendCode,
      handleSignOut,
      getToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
