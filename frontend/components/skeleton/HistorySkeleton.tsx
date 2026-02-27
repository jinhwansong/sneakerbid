import React from 'react';
import { Skeleton } from '../common/Skeleton';

export default function HistorySkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 flex-1 md:w-64 rounded-2xl" />
          <Skeleton className="h-11 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-bg-sub/50 border border-border-main rounded-[24px] p-6"
          >
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* List Items */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-bg-main border border-border-main rounded-[24px] p-4 md:p-6 flex items-center gap-4 md:gap-8"
          >
            <Skeleton className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
