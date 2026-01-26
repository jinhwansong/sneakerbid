import AuctionCard from '@/components/auction/AuctionCard';
import FeaturedAuction from '@/components/auction/FeaturedAuction';
import LiveActivityFeed from '@/components/auction/LiveActivityFeed';
import LiveStats from '@/components/auction/LiveStats';
import AuctionFilterTabs from '@/components/auction/AuctionFilterTabs';
import { DUMMY_AUCTIONS } from '@/lib/dummy';

export default function Home() {
  const featuredItem = DUMMY_AUCTIONS[0];  
  return (
      <main className="max-w-7xl mx-auto px-5 py-12 ">
        <div className="space-y-4 mb-24">
          <FeaturedAuction item={featuredItem} />
          <div className="space-y-4 ">
            <LiveStats />
            <LiveActivityFeed />
          </div>
        </div>

       

        <section >
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">
              입찰 진행 중인 상품
            </h2>
          </div>

          <AuctionFilterTabs className="mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DUMMY_AUCTIONS.map((auction) => (
              <AuctionCard key={auction.id} item={auction} />
            ))}
          </div>
        </section>
      </main>
  );
}
