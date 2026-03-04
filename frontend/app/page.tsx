import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import MainPageContent from '@/components/main/MainPageContent';
import { queryKeys } from '@/hooks/query/queryKeys';
import { queryDefaults } from '@/hooks/withQueryDefaults';
import type { GetMainAuctionsResponse, LiveStatsResponse } from '@/types/auction';

const EMPTY_MAIN: GetMainAuctionsResponse = { ongoing: [], closed: [] };
const DEFAULT_STATS: LiveStatsResponse = {
  activeBidders: 0,
  activeAuctions: 0,
  volume24h: 0,
  avgBidSpeedSeconds: 0.8,
};

async function prefetchMainAuctions(): Promise<GetMainAuctionsResponse> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/main`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch main auctions');
  const body = (await res.json()) as { success?: boolean; data?: GetMainAuctionsResponse };
  const data = (body?.success ? body.data : body) as GetMainAuctionsResponse | undefined;
  return data ?? EMPTY_MAIN;
}

async function prefetchLiveStats(): Promise<LiveStatsResponse> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/stats`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const body = (await res.json()) as LiveStatsResponse & { success?: boolean };
  return body ?? DEFAULT_STATS;
}

export default async function Home() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: queryDefaults },
  });
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.auctions.main,
      queryFn: prefetchMainAuctions,
    }).catch(() => {
      queryClient.setQueryData(queryKeys.auctions.main, EMPTY_MAIN);
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.auctions.stats,
      queryFn: prefetchLiveStats,
    }).catch(() => {
      queryClient.setQueryData(queryKeys.auctions.stats, DEFAULT_STATS);
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainPageContent />
    </HydrationBoundary>
  );
}
