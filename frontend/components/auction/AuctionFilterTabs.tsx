'use client';

import React from 'react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/cn';
import { AUCTION_FILTER_TABS } from '@/constants';

interface AuctionFilterTabsProps {
  tabs?: string[];
  activeIndex?: number;
  onChange?: (index: number, tab: string) => void;
  className?: string;
}

export default function AuctionFilterTabs({
  tabs = AUCTION_FILTER_TABS,
  activeIndex = 0,
  onChange,
  className,
}: AuctionFilterTabsProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2 scrollbar-hide', className)}>
      {tabs.map((tab, index) => (
        <Button
          key={tab}
          variant={index === activeIndex ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'rounded-full whitespace-nowrap px-5',
            index !== activeIndex && 'bg-bg-sub text-text-sub hover:bg-border-main'
          )}
          onClick={() => onChange?.(index, tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
}
