import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import AuctionDetailClient from '@/components/detail/AuctionDetailClient';
import { api } from '@/lib/api';
import { queryKeys } from '@/hooks/query/queryKeys';
import { queryDefaults } from '@/hooks/withQueryDefaults';

interface AuctionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function prefetchAuctionDetail(id: string) {
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  const init = cookie ? { headers: { Cookie: cookie } as HeadersInit } : undefined;
  const [auction, bids] = await Promise.all([
    api.auctions.get(id, init),
    api.auctions.getBids(id, init),
  ]);
  return {
    auction: auction as Awaited<ReturnType<typeof api.auctions.get>>,
    bids: Array.isArray(bids) ? bids : [],
  };
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const queryClient = new QueryClient({
    defaultOptions: { queries: queryDefaults },
  });

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auctions.detail(id),
      queryFn: () => prefetchAuctionDetail(id),
    });
  } catch {
    notFound();
  }

  const data = queryClient.getQueryData(
    queryKeys.auctions.detail(id),
  ) as { auction: unknown; bids: unknown[] } | undefined;
  if (!data?.auction) notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="max-w-7xl mx-auto px-5 py-10 md:py-14">
        <AuctionDetailClient auctionId={id} />
      </main>
    </HydrationBoundary>
  );
}
