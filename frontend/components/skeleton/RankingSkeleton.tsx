import React from 'react';
import { Skeleton } from '../common/Skeleton';

export default function RankingSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-5 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 mb-12 text-center">
        <Skeleton className="h-10 w-48 mx-auto rounded-lg" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-bg-sub p-1.5 rounded-[24px] mb-10">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 h-12 rounded-2xl mx-0.5" />
        ))}
      </div>

      {/* Ranking List */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 md:gap-8 p-4 md:p-6 rounded-[32px] bg-bg-main border border-border-main"
          >
            <Skeleton className="w-8 md:w-12 h-8 shrink-0 rounded" />
            <Skeleton className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-2xl" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
