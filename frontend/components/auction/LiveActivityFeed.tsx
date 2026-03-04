'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, Zap, Gavel } from 'lucide-react';
import { useHistoryEvents, type RecentBidPayload } from '@/hooks/useHistoryEvents';
import { queryKeys } from '@/hooks/query/queryKeys';
import { formatPrice } from '@/lib/util/format';

interface ActivityItem {
  id: string;
  type: 'bid' | 'sold';
  user: string;
  model: string;
  amount: string;
  time: string;
}

const MAX_ACTIVITIES = 20;

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const queryClient = useQueryClient();

  useHistoryEvents({
    isActive: true,
    onNewDeal: useCallback((item) => {
      setActivities((prev) => [
        {
          id: item.auctionId,
          type: 'sold',
          user: '-',
          model: item.modelName,
          amount: formatPrice(item.finalPrice),
          time: '방금 전',
        },
        ...prev.slice(0, MAX_ACTIVITIES - 1),
      ]);
    }, []),
    onNewBid: useCallback((item: RecentBidPayload) => {
      setActivities((prev) => [
        {
          id: `bid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'bid',
          user: item.user,
          model: item.modelName,
          amount: formatPrice(item.amount),
          time: item.time,
        },
        ...prev.slice(0, MAX_ACTIVITIES - 1),
      ]);
    }, []),
    onStatsUpdate: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.stats });
    }, [queryClient]),
  });

  return (
    <div className="w-full bg-bg-main border-y border-border-main/50 overflow-hidden py-3">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center">
          <div className="flex items-center gap-3 shrink-0 bg-bg-main pr-6 z-10 relative">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Activity size={14} className="animate-pulse" />
            </div>
            <span className="text-xs font-black text-brand-primary tracking-tighter uppercase">Live Activity</span>
            <div className="h-4 w-px bg-border-main ml-2" />
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-bg-main to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-bg-main to-transparent z-10 pointer-events-none" />

            <div className="flex gap-12 animate-marquee hover:pause-marquee whitespace-nowrap">
              {activities.length === 0 ? (
                <span className="text-[13px] text-text-muted py-1">실시간 입찰·낙찰 활동이 없습니다.</span>
              ) : (
                activities.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-[13px] py-1">
                    <span className="font-bold text-text-main shrink-0">{item.user}</span>
                    <span className="text-text-muted shrink-0 text-[11px]">님이</span>
                    <span className="font-bold text-text-main truncate max-w-[150px]">{item.model}</span>
                    <span className="text-text-muted shrink-0 text-[11px]">에</span>
                    <div className="flex items-center gap-1.5">
                      <span className={item.type === 'bid' ? 'text-status-active font-bold' : 'text-status-urgent font-bold'}>
                        {item.amount}
                      </span>
                      <span className="text-text-sub font-bold">
                        {item.type === 'bid' ? '입찰' : '낙찰'}
                      </span>
                      {item.type === 'bid' ? <Zap size={12} className="text-status-active" /> : <Gavel size={12} className="text-status-urgent" />}
                    </div>
                    <span className="text-[11px] text-text-muted ml-1 shrink-0">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
