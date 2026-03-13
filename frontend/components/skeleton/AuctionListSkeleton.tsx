import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';

export default function AuctionListSkeleton() {
  const cardCount = 6;
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">경매 목록을 불러오는 중입니다.</span>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl bg-bg-main border border-border-main"
          >
            <Skeleton className="aspect-4/3 w-full" />
            <div className="p-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
