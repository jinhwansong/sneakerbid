import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { headers } from 'next/headers';
import MainPageContent from '@/components/main/MainPageContent';
import { queryKeys } from '@/hooks/query/queryKeys';
import { queryDefaults } from '@/hooks/withQueryDefaults';
import type { GetMainAuctionsResponse, LiveStatsResponse } from '@/types/auction';
import { EMPTY_MAIN, DEFAULT_STATS } from '@/lib/constants/auction';

async function prefetchMainAuctions(): Promise<GetMainAuctionsResponse> {
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/main`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  if (!res.ok) throw new Error('Failed to fetch main auctions');
  const body = (await res.json()) as
    | { success?: boolean; data?: GetMainAuctionsResponse }
    | GetMainAuctionsResponse;
  // 백엔드 TransformInterceptor: 객체는 { success: true, ...data }로 spread (data 키 없음)
  const data =
    body && typeof body === 'object' && 'data' in body
      ? (body as { data?: GetMainAuctionsResponse }).data
      : (body as GetMainAuctionsResponse);
  return data ?? EMPTY_MAIN;
}

async function prefetchLiveStats(): Promise<LiveStatsResponse> {
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/stats`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const body = (await res.json()) as
    | { success?: boolean; data?: LiveStatsResponse }
    | LiveStatsResponse;
  const data =
    body && typeof body === 'object' && 'data' in body
      ? (body as { data?: LiveStatsResponse }).data
      : (body as LiveStatsResponse);
  return data ?? DEFAULT_STATS;
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
