import React from 'react';
import { Skeleton } from '../common/Skeleton';

export default function MainSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {/* Featured Section */}
      <div className="mb-12 md:mb-16 min-h-[560px] rounded-3xl overflow-hidden bg-bg-sub">
        <div className="w-full flex flex-col lg:flex-row items-center px-8 lg:px-20 py-16 gap-12">
          <div className="w-full lg:w-1/2 flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="h-12 w-px bg-border-main/30" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-16 w-48 rounded-2xl" />
              <Skeleton className="h-16 w-40 rounded-2xl" />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <Skeleton className="aspect-square w-full max-w-[400px] rounded-2xl" />
          </div>
        </div>
      </div>

      {/* LiveStats */}
      <div className="mb-4">
        <div className="w-full bg-bg-main border border-border-main rounded-lg overflow-hidden">
          <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border-main/50">
            <div className="w-full md:w-auto px-8 py-6 flex items-center gap-3 shrink-0 bg-bg-sub/30">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-8 py-4 flex flex-col gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LiveActivityFeed */}
      <div className="mb-12 md:mb-16">
        <div className="w-full bg-bg-main border-y border-border-main/50 py-3">
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <div className="h-4 w-px bg-border-main" />
              <Skeleton className="h-4 flex-1 max-w-96" />
            </div>
          </div>
        </div>
      </div>

      {/* MainAuctionSection */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl bg-bg-main border border-border-main"
            >
              <Skeleton className="aspect-4/3 relative" />
              <div className="p-5 flex flex-col gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
                <div className="flex justify-between items-end">
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <Skeleton className="h-11 w-full rounded-xl" />
                <div className="flex justify-between mt-3 pt-3 border-t border-border-main/50">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
