'use client';

import { useMe } from '@/hooks/query/useMe';
import { useMyWishlist } from '@/hooks/query/useMyWishlist';
import AuctionCard from '@/components/auction/AuctionCard';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import EmptyWishlist from '@/components/me/EmptyWishlist';
import WishlistError from '@/components/me/WishlistError';
import WishlistSkeleton from '@/components/skeleton/WishlistSkeleton';

export default function WishlistPage() {
  const { data: profile } = useMe();
  const { data: items = [], isLoading, isError } = useMyWishlist({
    enabled: !!profile,
  });

  if (!profile) return <LoginRequiredPrompt />;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        {/* 헤더 */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            찜 목록
          </h1>
          <p className="mt-1 text-text-sub font-medium">
            관심 경매를 모아보세요.
          </p>
        </div>

        {/* 컨텐츠 */}
        {isLoading ? (
          <WishlistSkeleton />
        ) : isError ? (
          <WishlistError />
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <>
            <p className="text-sm text-text-muted mb-6">
              총 <span className="font-bold text-text-main">{items.length}</span>개
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              {items.map((item) => (
                <AuctionCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
