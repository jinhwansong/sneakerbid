'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { TrendingUp, Users, Flame, Award } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { DUMMY_AUCTIONS } from '@/lib/dummy';
import VirtualizedList from '@/components/common/VirtualizedList';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const TABS = [
  { id: 'popular', label: '인기 급상승', icon: Flame },
  { id: 'bids', label: '입찰 많은 순', icon: Users },
  { id: 'trending', label: '시세 급등', icon: TrendingUp },
];

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('popular');

  const allRankingItems = useMemo(() => {
    return [...DUMMY_AUCTIONS].sort((a, b) => b.participants - a.participants);
  }, []);

  const {
    items: displayItems,
    isLoading,
    hasMore,
    loadMore,
    reset,
  } = useInfiniteScroll({
    data: allRankingItems,
    pageSize: 4,
    delayMs: 800,
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    reset();
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-text-main tracking-tight">
          실시간 랭킹
        </h1>
        <p className="text-text-sub font-medium">
          지금 이 시각 가장 핫한 스니커즈를 확인하세요.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-bg-sub p-1.5 rounded-[24px] mb-10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-2xl transition-all cursor-pointer',
                activeTab === tab.id
                  ? 'bg-bg-main text-text-main shadow-sm shadow-black/5'
                  : 'text-text-muted hover:text-text-sub'
              )}
            >
              <Icon
                size={18}
                className={activeTab === tab.id ? 'text-brand-primary' : ''}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Virtualized Ranking List */}
      <VirtualizedList
        data={displayItems}
        loading={isLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        renderItem={(item, index) => (
          <div
            key={item.id}
            className="group relative flex items-center gap-4 md:gap-8 p-4 md:p-6 rounded-[32px] bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 transition-all"
          >
            {/* Rank Number */}
            <div className="w-8 md:w-12 flex flex-col items-center shrink-0">
              <span
                className={cn(
                  'text-xl md:text-2xl font-black tracking-tighter',
                  index < 3 ? 'text-brand-primary' : 'text-text-muted/40'
                )}
              >
                {index + 1}
              </span>
              {index < 3 && <Award size={14} className="text-brand-primary" />}
            </div>

            {/* Product Image */}
            <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 bg-bg-card rounded-2xl overflow-hidden flex items-center justify-center">
              <Image
                src={item.imageUrl}
                alt={item.modelName}
                width={96}
                height={96}
                className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
                {item.brand}
              </p>
              <h3 className="text-sm md:text-lg font-bold text-text-main truncate mb-1">
                {item.modelName}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-text-main">
                  {formatPrice(item.currentBid)}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-status-active">
                  <TrendingUp size={12} />
                  <span>+{(15.4 - index * 1.2).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1.5 text-text-sub font-bold">
                <Users size={14} className="text-text-muted" />
                <span className="text-sm">
                  {item.participants.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-text-muted font-medium">참여 중</p>
            </div>
          </div>
        )}
      />
    </main>
  );
}
