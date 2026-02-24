import { notFound } from 'next/navigation';
import AuctionDetailClient from '@/components/detail/AuctionDetailClient';
import { api } from '@/lib/api';
import type { AuctionItem, BidLogItem } from '@/types/auction';

interface AuctionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  let item: AuctionItem & { initialBids?: BidLogItem[] };
  try {
    const [auctionData, bidsData] = await Promise.all([
      api.auctions.get(id),
      api.auctions.getBids(id).catch(() => []),
    ]);
    item = auctionData as AuctionItem;
    item.initialBids = bidsData;
  } catch {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-5 py-10 md:py-14">
      <AuctionDetailClient item={item} auctionId={id} />
    </main>
  );
}
