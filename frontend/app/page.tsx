import FeaturedAuction from '@/components/auction/FeaturedAuction';
import LiveActivityFeed from '@/components/auction/LiveActivityFeed';
import LiveStats from '@/components/auction/LiveStats';
import MainAuctionSection from '@/components/auction/MainAuctionSection';
import { DUMMY_AUCTIONS } from '@/lib/dummy';

export default function Home() {
  const featuredItem = DUMMY_AUCTIONS[0];

  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      <div className="mb-12 md:mb-16">
        <FeaturedAuction item={featuredItem} />
      </div>
      <div className="space-y-4 mb-12 md:mb-16">
        <LiveStats />
        <LiveActivityFeed />
      </div>
      <MainAuctionSection items={DUMMY_AUCTIONS} />
    </main>
  );
}
