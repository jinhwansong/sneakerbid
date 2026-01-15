'use client';

import { useState } from 'react';
 import { Dropdown } from '@/components/common/Dropdown';
 import { Search, Calendar, ArrowUpRight, CheckCircle2 } from 'lucide-react';
 import { cn } from '@/lib/cn';
 import { formatPrice } from '@/lib/format';
 import { DUMMY_HISTORY } from '@/lib/dummy';
 import { PERIOD_OPTIONS } from '@/constants';
 import VirtualizedList from '@/components/common/VirtualizedList';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
 import Image from 'next/image';

 export default function HistoryPage() {
   const [period, setPeriod] = useState('1m');

  const {
    items: displayItems,
    isLoading,
    hasMore,
    loadMore,
    reset,
  } = useInfiniteScroll({
    data: DUMMY_HISTORY,
    pageSize: 3,
    delayMs: 800,
  });

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    reset();
  };

  return (
    <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            거래내역
          </h1>
          <p className="text-text-sub font-medium">
            최근 성사된 스니커즈 경매 체결 내역입니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="모델명 검색"
              className="w-full h-11 bg-bg-sub rounded-2xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
          <Dropdown
            options={PERIOD_OPTIONS}
            value={period}
            onSelect={handlePeriodChange}
            width="w-36"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-bg-sub/50 border border-border-main rounded-[24px] p-6">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
            오늘 체결 건수
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">124</span>
            <span className="text-xs font-bold text-status-active flex items-center gap-0.5">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
        </div>
        <div className="bg-bg-sub/50 border border-border-main rounded-[24px] p-6">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
            평균 낙찰가
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">₩342,000</span>
          </div>
        </div>
        <div className="bg-bg-sub/50 border border-border-main rounded-[24px] p-6">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
            최고 낙찰가 (24h)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-main">
              ₩1,850,000
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-sm font-bold text-text-sub">
            체결 상세 내역
          </span>
          <span className="text-xs font-medium text-text-muted">
            전체 {DUMMY_HISTORY.length}건
          </span>
        </div>

        <VirtualizedList
          data={displayItems}
          loading={isLoading}
          hasMore={hasMore}
          loadMore={loadMore}
          renderItem={(item) => (
            <div
              key={item.id}
              className="group bg-bg-main border border-border-main rounded-[24px] p-4 md:p-6 flex items-center gap-4 md:gap-8 hover:shadow-xl hover:shadow-black/5 transition-all"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-bg-card rounded-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src={item.imageUrl}
                  alt={item.modelName}
                  width={80}
                  height={80}
                  className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
                  {item.brand}
                </p>
                <h3 className="text-sm md:text-base font-bold text-text-main truncate mb-1 md:mb-2">
                  {item.modelName}
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-medium text-text-sub">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-text-muted" />
                    {item.date}
                  </span>
                  <span className="w-1 h-1 bg-border-main rounded-full" />
                  <span>{item.participants}명 참여</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="text-sm md:text-lg font-black text-text-main tabular-nums">
                  {formatPrice(item.finalPrice)}
                </p>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold',
                    item.status === 'completed'
                      ? 'bg-status-active/10 text-status-active'
                      : 'bg-text-muted/10 text-text-muted'
                  )}
                >
                  {item.status === 'completed' ? (
                    <>
                      <CheckCircle2 size={12} />
                      거래 완료
                    </>
                  ) : (
                    '거래 취소'
                  )}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </main>
  );
}
