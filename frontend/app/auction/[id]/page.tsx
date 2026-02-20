import { notFound } from 'next/navigation';
import AuctionDetailClient from '@/components/detail/AuctionDetailClient';
import { api } from '@/lib/api';
import type { AuctionItem } from '@/types/auction';

interface AuctionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  let item: AuctionItem & { initialBids?: { id: string; user: string; amount: number; time: string; isBot: boolean }[] };
  try {
    const [auctionData, bidsData] = await Promise.all([
      api.getAuction(id),
      api.getBids(id).catch(() => []),
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