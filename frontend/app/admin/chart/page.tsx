'use client';

import { useState } from 'react';
import { useAdminBidHistory } from '@/hooks/query/useAdminBidHistory';
import { formatPrice } from '@/lib/util/format';
import { BarChart3, Search } from 'lucide-react';
import { AdminLineChart } from '@/components/chart/AdminLineChart';
import {
  AdminChartSkeleton,
  AdminErrorState,
} from '@/components/skeleton/AdminSkeleton';

export default function AdminChartPage() {
  const [auctionId, setAuctionId] = useState('');
  const [searchId, setSearchId] = useState('');
  const {
    data: history,
    isLoading,
    isError,
    refetch,
  } = useAdminBidHistory(searchId || null, 500);

  const handleSearch = () => {
    const trimmed = auctionId.trim();
    setSearchId(trimmed);
    if (trimmed === searchId) {
      refetch();
    }
  };

  const chartData =
    history?.map((p) => ({
      ...p,
      time: new Date(p.createdAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    })) ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
          가격 변동 차트
        </h1>
        <p className="mt-1 text-text-sub font-medium">
          경매별 입찰 가격 시계열을 확인할 수 있습니다.
        </p>
      </div>

      {/* 경매 ID 검색 */}
      <div className="mb-8 p-5 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              size={18}
            />
            <input
              type="text"
              placeholder="경매 ID 입력"
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-11 pl-12 pr-4 rounded-xl bg-bg-input border border-border-main text-text-main placeholder:text-text-muted text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="h-11 px-5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2"
          >
            <BarChart3 size={18} />
            조회
          </button>
        </div>
      </div>

      {/* 차트 */}
      {!searchId ? (
        <div className="py-24 text-center text-text-muted">
          경매 ID를 입력하고 조회해 주세요.
        </div>
      ) : isLoading ? (
        <AdminChartSkeleton />
      ) : isError ? (
        <AdminErrorState message="입찰 히스토리를 불러오는데 실패했습니다." />
      ) : chartData.length === 0 ? (
        <div className="py-24 text-center text-text-muted">
          입찰 내역이 없습니다.
        </div>
      ) : (
        <AdminLineChart
          data={chartData}
          xDataKey="time"
          yDataKey="bidPrice"
          yTickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
          tooltipLabel="입찰가"
          labelPrefix="시간"
          tooltipValueFormatter={(v) => formatPrice(v) + '원'}
          height={400}
        />
      )}
    </div>
  );
}
