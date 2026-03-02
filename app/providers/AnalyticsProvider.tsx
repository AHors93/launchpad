import { PostHogProvider } from 'posthog-react-native';
import React from 'react';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? '';

  if (apiKey === '' || host === '') {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        host,
        enableSessionReplay: false,
        flushInterval: __DEV__ ? 5000 : 30000,
        flushAt: 1,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
