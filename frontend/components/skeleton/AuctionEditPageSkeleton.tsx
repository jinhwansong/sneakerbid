import React from 'react';
import { Skeleton } from '../common/Skeleton';
import AuctionFormSkeleton from './AuctionFormSkeleton';

export default function AuctionEditPageSkeleton() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-6xl mx-auto px-5 pt-8 mb-8">
        <Skeleton className="h-5 w-40" />
      </div>
      <AuctionFormSkeleton />
    </main>
  );
}
