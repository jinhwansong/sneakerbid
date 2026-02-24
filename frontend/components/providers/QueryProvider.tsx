'use client';

import { useState } from 'react';
import {
  CancelledError,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { queryDefaults } from '@/hooks/withQueryDefaults';
import { useToastStore } from '@/store/useToastStore';
import { queryKeys } from '@/hooks/query/queryKeys';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  // React Query 취소 에러 등은 토스트 안 띄움
  if (error instanceof CancelledError) return null;

  if (error instanceof Error) {
    return error.message || null;
  }
  if (typeof error === 'string') {
    return error;
  }
  return null;
}

function createQueryClient() {
  const { showToast } = useToastStore.getState();

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const key0 = query.queryKey?.[0];
        if (key0 === queryKeys.me[0]) return;

        const message = getErrorMessage(error);
        if (!message) return;

        /* 에러 인증 메시지 변경 */
        let status: number | undefined;

        if (error instanceof CancelledError) return null;

        if (status === 401 || status === 403) {
          showToast('로그인이 필요합니다.', 'error');
          return;
        }

        showToast(message, 'error');
      },
    }),
    defaultOptions: {
      queries: queryDefaults,
    },
  });
}

