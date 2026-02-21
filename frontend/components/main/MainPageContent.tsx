'use client';

import FeaturedAuction from '@/components/auction/FeaturedAuction';
import LiveActivityFeed from '@/components/auction/LiveActivityFeed';
import LiveStats from '@/components/auction/LiveStats';
import MainAuctionSection from '@/components/auction/MainAuctionSection';
import {
  useMainAuctions,
  mainAuctionsToItems,
} from '@/hooks/query/useMainAuctions';

export default function MainPageContent() {
  const { data, isLoading } = useMainAuctions();
  const items = mainAuctionsToItems(data);
  const featuredItem = items[0];
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-12 md:mb-16 h-[320px] bg-bg-sub rounded-3xl animate-pulse" />
        <div className="space-y-4 mb-12 md:mb-16">
          <LiveStats />
          <LiveActivityFeed />
        </div>
        <div className="h-64 bg-bg-sub rounded-2xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {featuredItem && (
        <div className="mb-12 md:mb-16">
          <FeaturedAuction item={featuredItem} />
        </div>
      )}
      <div className="space-y-4 mb-12 md:mb-16">
        <LiveStats />
        <LiveActivityFeed />
      </div>
      <MainAuctionSection items={items} />
    </main>
  );
}

