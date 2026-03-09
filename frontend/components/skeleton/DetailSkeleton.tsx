import React from 'react';
import { Skeleton } from '../common/Skeleton';

export default function DetailSkeleton() {
  return (
    <>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">경매 상세를 불러오는 중입니다.</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16">
      <div className="space-y-6">
        <Skeleton className="aspect-square w-full max-w-[500px] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
        <div className="rounded-2xl border border-border-main p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border-main p-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
