'use client';

import React from 'react';
import { AuctionItem } from '@/types/auction';
import { AuctionCard } from './AuctionCard';
import { ChevronRight } from 'lucide-react';

interface HorizontalAuctionListProps {
  title: string;
  items: AuctionItem[];
}

export const HorizontalAuctionList: React.FC<HorizontalAuctionListProps> = ({ title, items }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">
          {title}
        </h3>
        <button className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-main transition-colors">
          전체보기 <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <AuctionCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};
