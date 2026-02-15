'use client';

import { useMemo, useState } from 'react';
import AuctionCard from '@/components/auction/AuctionCard';
import { MAIN_STATUS_FILTERS, STATUS_MAP } from '@/constants';
import { AuctionItem, AuctionStatus } from '@/types/auction';
import { cn } from '@/lib/cn';

function filterByStatus(items: AuctionItem[], tab: (typeof MAIN_STATUS_FILTERS)[number]) {
  const statuses = STATUS_MAP[tab];
  return items.filter((item) => (statuses as readonly AuctionStatus[]).includes(item.status));
}

interface MainAuctionSectionProps {
  items: AuctionItem[];
  className?: string;
}

export default function MainAuctionSection({ items, className }: MainAuctionSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentTab = MAIN_STATUS_FILTERS[activeIndex];
  const filtered = useMemo(() => filterByStatus(items, currentTab), [items, currentTab]);

  return (
    <section className={cn('', className)}>
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">
          경매 상품
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
        {MAIN_STATUS_FILTERS.map((tab: (typeof MAIN_STATUS_FILTERS)[number], index: number) => (
          <button
            key={tab}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-full whitespace-nowrap px-5 py-2.5 text-sm font-semibold transition-colors',
              index === activeIndex
                ? 'bg-text-main text-bg-main dark:bg-text-main dark:text-bg-main'
                : 'bg-bg-sub text-text-sub hover:bg-border-main hover:text-text-main'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((auction) => (
          <AuctionCard key={auction.id} item={auction} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm font-medium">
          해당 상태의 경매 상품이 없습니다.
        </div>
      )}
    </section>
  );
}
