import { notFound } from 'next/navigation';
import { DUMMY_AUCTIONS } from '@/lib/dummy';
import { AuctionDetailClient } from '@/components/auction/AuctionDetailClient';

interface AuctionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const item = DUMMY_AUCTIONS.find((auction) => auction.id === id);

  if (!item) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-5 py-10 md:py-14">
      <AuctionDetailClient item={item} />
    </main>
  );
}
