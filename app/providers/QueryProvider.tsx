import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

import { isBackendConfigured } from '@/services/api';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Local-only: data never stale (AsyncStorage reads are instant)
            // API mode: refetch after 30s to keep data fresh
            staleTime: isBackendConfigured() ? 30_000 : Infinity,
            retry: isBackendConfigured() ? 2 : false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
