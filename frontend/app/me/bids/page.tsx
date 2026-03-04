'use client';

import { useState } from 'react';

import { useMe } from '@/hooks/query/useMe';

import { cn } from '@/lib/cn';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { useMyOrders } from '@/hooks/query/useMyOrders';
import { useMyBiddingAuctions } from '@/hooks/query/useMyBiddingAuctions';
import AuctionCard from '@/components/auction/AuctionCard';
import EmptyOngoing from '@/components/me/EmptyOngoing';
import EmptyLost from '@/components/me/EmptyLost';
import EmptyWon from '@/components/me/EmptyWon';
import WonCard from '@/components/me/WonCard';

const TABS = [
  { id: 'ongoing', label: '입찰중' },
  { id: 'won', label: '낙찰됨' },
  { id: 'lost', label: '유찰됨' },
] as const;

export default function MyBidsPage() {
  const { data: profile, isLoading: isMeLoading } = useMe();
  const {
    data: ongoingItems = [],
    isLoading: isLoadingOngoing,
    isError: isErrorOngoing,
  } = useMyBiddingAuctions({
    enabled: !!profile,
    status: 'ongoing',
  });
  const {
    data: closedItems = [],
    isLoading: isLoadingClosed,
    isError: isErrorClosed,
  } = useMyBiddingAuctions({
    enabled: !!profile,
    status: 'closed',
  });
  const {
    data: orders = [],
    isLoading: isLoadingWon,
    isError: isErrorWon,
  } = useMyOrders({
    enabled: !!profile,
  });
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('ongoing');

  if (isMeLoading) return null;
  if (!profile) return <LoginRequiredPrompt />;

  const wonItems = orders;
  const lostItems = closedItems.filter((item) => item.winnerUserId !== profile.id);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        {/* 헤더 */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            내 입찰
          </h1>
          <p className="mt-1 text-text-sub font-medium">
            입찰 중인 경매와 낙찰 내역을 확인하세요.
          </p>
        </div>

        {/* 탭 */}
        <div className="flex bg-bg-sub p-1.5 rounded-2xl mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-sm font-bold rounded-xl transition-all',
                activeTab === tab.id
                  ? 'bg-bg-main text-text-main shadow-sm shadow-black/5'
                  : 'text-text-muted hover:text-text-sub',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        {activeTab === 'ongoing' && (
          <>
            {isLoadingOngoing ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : isErrorOngoing ? (
              <div className="py-16 text-center">
                <p className="text-text-muted">
                  입찰 중인 경매 목록을 불러오는 중 오류가 발생했습니다.
                </p>
              </div>
            ) : ongoingItems.length === 0 ? (
              <EmptyOngoing />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {ongoingItems.map((item) => (
                  <AuctionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'lost' && (
          <>
            {isLoadingClosed ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : isErrorClosed ? (
              <div className="py-16 text-center">
                <p className="text-text-muted">
                  유찰된 경매 목록을 불러오는 중 오류가 발생했습니다.
                </p>
              </div>
            ) : lostItems.length === 0 ? (
              <EmptyLost />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {lostItems.map((item) => (
                  <AuctionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'won' && (
          <>
            {isLoadingWon ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : isErrorWon ? (
              <div className="py-16 text-center">
                <p className="text-text-muted">
                  낙찰 내역을 불러오는 중 오류가 발생했습니다.
                </p>
              </div>
            ) : wonItems.length === 0 ? (
              <EmptyWon />
            ) : (
              <div className="flex flex-col gap-4">
                {wonItems.map((item) => (
                  <WonCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
