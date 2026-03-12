import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { headers } from 'next/headers';
import MainPageContent from '@/components/main/MainPageContent';
import { queryKeys } from '@/hooks/query/queryKeys';
import { queryDefaults } from '@/hooks/withQueryDefaults';
import type { GetMainAuctionsResponse, LiveStatsResponse } from '@/types/auction';
import { EMPTY_MAIN, DEFAULT_STATS } from '@/lib/constants/auction';

/** Server-only base URL; fallback to NEXT_PUBLIC_SITE_URL. Cookie forwarded only when API_URL is set. */
function getServerApiBase(): { base: string; trusted: boolean } {
  const base = (process.env.API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  return { base, trusted: !!process.env.API_URL };
}

async function prefetchMainAuctions(): Promise<GetMainAuctionsResponse> {
  const { base, trusted } = getServerApiBase();
  const headersList = await headers();
  const cookie = trusted ? (headersList.get('cookie') ?? '') : '';
  const url = `${base}/auctions/main`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  if (!res.ok) throw new Error('Failed to fetch main auctions');
  const body = (await res.json()) as
    | { success?: boolean; message?: string; data?: GetMainAuctionsResponse }
    | GetMainAuctionsResponse;
  if (body && typeof body === 'object' && (body as { success?: boolean }).success === false) {
    const msg = (body as { message?: string }).message ?? 'Server returned failure';
    throw new Error(msg);
  }
  const data =
    body && typeof body === 'object' && 'data' in body
      ? (body as { data?: GetMainAuctionsResponse }).data
      : (body as GetMainAuctionsResponse);
  if (!data || typeof data !== 'object' || !Array.isArray(data.ongoing)) {
    return EMPTY_MAIN;
  }
  return data;
}

async function prefetchLiveStats(): Promise<LiveStatsResponse> {
  const { base } = getServerApiBase();
  const url = `${base}/auctions/stats`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const body = (await res.json()) as
    | { success?: boolean; message?: string; data?: LiveStatsResponse }
    | LiveStatsResponse;
  if (body && typeof body === 'object' && (body as { success?: boolean }).success === false) {
    const msg = (body as { message?: string }).message ?? 'Server returned failure';
    throw new Error(msg);
  }
  const data =
    body && typeof body === 'object' && 'data' in body
      ? (body as { data?: LiveStatsResponse }).data
      : (body as LiveStatsResponse);
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.activeBidders !== 'number' ||
    typeof data.activeAuctions !== 'number' ||
    typeof data.volume24h !== 'number' ||
    typeof data.avgBidSpeedSeconds !== 'number'
  ) {
    return DEFAULT_STATS;
  }
  return data;
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

  const initialMain = queryClient.getQueryData(queryKeys.auctions.main) as GetMainAuctionsResponse;
  const initialStats = queryClient.getQueryData(queryKeys.auctions.stats) as LiveStatsResponse;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainPageContent
        initialMain={initialMain ?? EMPTY_MAIN}
        initialStats={initialStats ?? DEFAULT_STATS}
      />
    </HydrationBoundary>
  );
}
