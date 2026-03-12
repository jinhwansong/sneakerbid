import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';

export default function AuctionFormSkeleton() {
  return (
    <div className="min-h-screen bg-bg-main pb-24 max-w-6xl mx-auto px-5 py-8 md:py-16">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">경매 폼을 불러오는 중입니다.</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-16">
          <section className="space-y-10">
            <div className="border-b border-border-main pb-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </section>

          <section className="space-y-10">
            <div className="border-b border-border-main pb-4">
              <Skeleton className="h-6 w-28 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </section>

          <div className="pt-8 border-t border-border-main">
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
