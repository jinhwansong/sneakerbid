'use client';

import { useState } from 'react';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { queryDefaults } from '@/hooks/withQueryDefaults';
import { useToastStore } from '@/store/useToastStore';
import { queryKeys } from '@/hooks/query/queryKeys';

function getDefaultQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // useMe는 queryFn에서 catch 후 null 반환하므로 여기 오지 않음
        const key = query.queryKey?.[0];
        if (key === queryKeys.me[0]) return;
        const message =
          error instanceof Error ? error.message : '일시적인 오류가 발생했습니다';
        useToastStore.getState().showToast(message, 'error');
      },
    }),
    defaultOptions: {
      queries: queryDefaults,
    },
  });
}

export default function QueryProvider({
  children,
}: { children: React.ReactNode }) {
  const [queryClient] = useState(getDefaultQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

