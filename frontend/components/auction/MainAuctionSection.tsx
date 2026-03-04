'use client';

import AuctionCard from '@/components/auction/AuctionCard';
import {
  useMainAuctions,
  mainAuctionsToItems,
} from '@/hooks/query/useMainAuctions';

const ONGOING_STATUSES = ['ongoing', 'ending_soon'] as const;


export default function MainAuctionSection() {
  const { data } = useMainAuctions();
  const items = mainAuctionsToItems(data);
  const ongoing = items.filter((item) =>
    (ONGOING_STATUSES as readonly string[]).includes(item.status),
  );

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">
          경매 상품
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ongoing.map((auction) => (
          <AuctionCard key={auction.id} item={auction} />
        ))}
      </div>

      {ongoing.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm font-medium">
          진행 중인 경매 상품이 없습니다.
        </div>
      )}
    </section>
  );
}
