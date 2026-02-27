declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_COGNITO_USER_POOL_ID?: string;
    EXPO_PUBLIC_COGNITO_CLIENT_ID?: string;
    EXPO_PUBLIC_COGNITO_REGION?: string;
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_STREAMING_URL?: string;
    EXPO_PUBLIC_ANTHROPIC_API_KEY?: string;
  }
}
