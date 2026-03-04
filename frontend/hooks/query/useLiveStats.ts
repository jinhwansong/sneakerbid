import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LiveStatsResponse } from '@/types/auction';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';
import { DEFAULT_STATS } from '@/lib/constants/auction';

export function useLiveStats() {
  return useQuery(
    withQueryDefaults<LiveStatsResponse>({
      queryKey: queryKeys.auctions.stats,
      queryFn: async () => (await api.auctions.getStats()) ?? DEFAULT_STATS,
      refetchInterval: 30_000, // 30초마다 갱신
    }),
  );
}
