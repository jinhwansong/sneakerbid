import { UseQueryOptions } from '@tanstack/react-query';

export const queryDefaults = {
  staleTime: 1000 * 60 * 5, // 5분
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export function withQueryDefaults<TData>(
  opts: UseQueryOptions<TData>,
): UseQueryOptions<TData> {
  return {
    ...queryDefaults,
    ...opts,
  };
}
