'use client';

import FeaturedAuction from '@/components/auction/FeaturedAuction';
import LiveActivityFeed from '@/components/auction/LiveActivityFeed';
import LiveStats from '@/components/auction/LiveStats';
import MainAuctionSection from '@/components/auction/MainAuctionSection';
import MainSkeleton from '@/components/skeleton/MainSkeleton';
import {
  useMainAuctions,
  mainAuctionsToItems,
} from '@/hooks/query/useMainAuctions';
import type { GetMainAuctionsResponse, LiveStatsResponse } from '@/types/auction';

interface MainPageContentProps {
  initialMain?: GetMainAuctionsResponse;
  initialStats?: LiveStatsResponse;
}

export default function MainPageContent({
  initialMain,
  initialStats,
}: MainPageContentProps = {}) {
  const { data, isLoading } = useMainAuctions(initialMain);
  const items = mainAuctionsToItems(data ?? initialMain);
  const featuredItem = items[0];
  if (isLoading && !initialMain) return <MainSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {featuredItem && (
        <div className="mb-12 md:mb-16">
          <FeaturedAuction item={featuredItem} />
        </div>
      )}
      <div className="space-y-4 mb-12 md:mb-16">
        <LiveStats initialStats={initialStats} />
        <LiveActivityFeed />
      </div>
      <MainAuctionSection />
    </main>
  );
}




