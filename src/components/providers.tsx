'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 60 * 1000, // 1 minute
      
      // Time in milliseconds that data remains in cache
      gcTime: 5 * 60 * 1000, // 5 minutes
      
      // Number of times to retry on failure
      retry: 3,
      
      // Delay between retries in ms
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Number of times to retry on failure
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
