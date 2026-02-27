import React from 'react';
import { Skeleton } from '../common/Skeleton';

export default function ProfileSkeleton() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="bg-bg-card border border-border-main rounded-2xl md:rounded-3xl overflow-hidden">
          <div className="p-6 md:p-10 flex flex-col sm:flex-row items-center gap-6 md:gap-10">
            <Skeleton variant="circle" className="w-24 h-24 md:w-28 md:h-28" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="px-6 md:px-10 py-5 bg-bg-sub/50 border-t border-border-main">
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-border-main border-t border-border-main">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5">
                <Skeleton className="h-7 w-12 mx-auto" />
                <Skeleton className="h-4 w-14 mx-auto mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

