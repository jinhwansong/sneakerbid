import { Header } from '@/components/layout/Header';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { FeaturedAuction } from '@/components/auction/FeaturedAuction';
import { HorizontalAuctionList } from '@/components/auction/HorizontalAuctionList';
import { LiveActivityFeed } from '@/components/auction/LiveActivityFeed';
import { OnboardingModal } from '@/components/features/OnboardingModal';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/cn';
import { DUMMY_AUCTIONS } from '@/lib/dummy';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const featuredItem = DUMMY_AUCTIONS[0];
  const endingSoonItems = DUMMY_AUCTIONS.slice(1, 5);

  return (
    <div className="min-h-screen bg-bg-main">
      <OnboardingModal />
      <Header />

      <main className="max-w-7xl mx-auto px-5 py-12">
        {/* 그룹 1: Hero & Live (실시간 상황 - 밀접 배치) */}
        <div className="space-y-10 mb-18">
          <FeaturedAuction item={featuredItem} />
          <LiveActivityFeed />
        </div>

        <div className="mb-18">
          <HorizontalAuctionList
            title="종료 임박 경매 ⚡"
            items={endingSoonItems}
          />
        </div>

        <section className="pt-16 border-t border-border-main/50">
          <h2 className="text-xl md:text-2xl font-bold text-text-main tracking-tight mb-6">
            입찰 진행 중인 상품
          </h2>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {['전체', '인기', '종료임박', '신규'].map((tab, i) => (
              <Button
                key={tab}
                variant={i === 0 ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full whitespace-nowrap px-5',
                  i !== 0 && 'bg-bg-sub text-text-sub hover:bg-border-main'
                )}
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DUMMY_AUCTIONS.map((auction) => (
              <AuctionCard key={auction.id} item={auction} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
