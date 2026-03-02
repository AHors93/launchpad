import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { appleSignInApi, isBackendConfigured } from '@/services/api';
import { AuthState, AuthUser } from '@/types/auth';

interface AuthContextValue extends AuthState {
  handleSignIn: (email: string, password: string) => Promise<void>;
  handleSignUp: (email: string, password: string) => Promise<void>;
  handleConfirmSignUp: (email: string, code: string) => Promise<void>;
  handleResendCode: (email: string) => Promise<void>;
  handleAppleSignIn: () => Promise<void>;
  isAppleSignInAvailable: boolean;
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

  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  // Check Apple Sign In availability
  useEffect(() => {
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }
  }, []);

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
    const result = await signIn({
      username: email,
      password,
      // Expo Go lacks native crypto for SRP — use plain password flow in dev
      ...(__DEV__ ? { options: { authFlowType: 'USER_PASSWORD_AUTH' as const } } : {}),
    });
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

  const handleAppleSignIn = useCallback(async () => {
    if (!isBackendConfigured()) {
      throw new Error('Backend not configured');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken === null) {
      throw new Error('No identity token from Apple');
    }

    // Exchange Apple token for Cognito auth key via backend
    const { email, authKey } = await appleSignInApi({
      identityToken: credential.identityToken,
      fullName: credential.fullName
        ? {
            givenName: credential.fullName.givenName,
            familyName: credential.fullName.familyName,
          }
        : undefined,
    });

    // Sign in with Amplify using the auth key
    const result = await signIn({
      username: email,
      password: authKey,
      ...(__DEV__ ? { options: { authFlowType: 'USER_PASSWORD_AUTH' as const } } : {}),
    });

    if (result.isSignedIn) {
      const cognitoUser = await getCurrentUser();
      setState({
        isLoading: false,
        isAuthenticated: true,
        user: { userId: cognitoUser.userId, email },
        needsConfirmation: false,
        confirmationEmail: null,
      });
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
    try {
      await signOut();
    } catch {
      // Session may already be invalid — clear local state anyway
    }
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
      handleAppleSignIn,
      isAppleSignInAvailable,
      handleSignOut,
      getToken,
    }),
    [
      state,
      handleSignIn,
      handleSignUp,
      handleConfirmSignUp,
      handleResendCode,
      handleAppleSignIn,
      isAppleSignInAvailable,
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
