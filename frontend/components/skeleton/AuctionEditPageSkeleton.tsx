import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import AuctionFormSkeleton from '@/components/skeleton/AuctionFormSkeleton';

export default function AuctionEditPageSkeleton() {
  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-bg-main"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">경매 수정 페이지를 불러오는 중입니다.</span>
      <div className="max-w-6xl mx-auto px-5 pt-8 mb-8">
        <Skeleton className="h-5 w-40" />
      </div>
      <AuctionFormSkeleton />
    </main>
  );
}
