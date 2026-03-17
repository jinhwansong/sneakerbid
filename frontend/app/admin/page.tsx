'use client';

import { useAdminSettlement } from '@/hooks/query/useAdminSettlement';
import { useAdminTimeline } from '@/hooks/query/useAdminTimeline';
import { formatPrice } from '@/lib/util/format';
import { Users } from 'lucide-react';
import {
  AdminQueryState,
  AdminSettlementSkeleton,
} from '@/components/skeleton/AdminSkeleton';
import {
  ADMIN_STAT_CARDS,
  getAdminDerivedStats,
  ADMIN_DERIVED_STAT_ICONS,
} from '@/constants/admin';
import { AdminLineChart } from '@/components/chart/AdminLineChart';

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminSettlement();
  const { data: timeline, isLoading: isTimelineLoading } =
    useAdminTimeline(14);

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !data}
      errorMessage="정산 데이터를 불러오는데 실패했습니다."
      renderLoading={() => <AdminSettlementSkeleton />}
    >
      {data && (
      <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
          정산 현황
        </h1>
        <p className="mt-1 text-text-sub font-medium">
          결제·경매·주문 집계 현황입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ADMIN_STAT_CARDS.map(({ key, label, icon: Icon, format }) => (
          <div
            key={key}
            className="p-5 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-bg-sub">
                <Icon size={18} className="text-text-sub" />
              </div>
              <span className="text-sm font-medium text-text-sub">{label}</span>
            </div>
            <p className="text-xl font-black text-text-main">
              {format(data[key])}
            </p>
          </div>
        ))}
      </div>

      {/* 파생 지표 */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-text-main mb-4">요약 지표</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getAdminDerivedStats(data).map(({ key, label, value, format }) => {
            const Icon = ADMIN_DERIVED_STAT_ICONS[key];
            return (
            <div
              key={key}
              className="p-5 rounded-2xl bg-bg-sub/50 dark:bg-bg-sub/30 border border-border-subtle"
            >
              <div className="flex items-center gap-3 mb-2">
                {Icon && (
                  <div className="p-2 rounded-lg bg-bg-main/50">
                    <Icon size={18} className="text-text-muted" />
                  </div>
                )}
                <span className="text-sm font-medium text-text-sub">{label}</span>
              </div>
              <p className="text-xl font-black text-text-main">
                {format(value)}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      {/* 총 유저 수 + 차트 */}
      {timeline && (
        <div className="mt-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-5 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-bg-sub">
                  <Users size={18} className="text-text-sub" />
                </div>
                <span className="text-sm font-medium text-text-sub">
                  총 유저 수
                </span>
              </div>
              <p className="text-xl font-black text-text-main">
                {timeline.totalUsers.toLocaleString()}명
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-main mb-4">
              일별 결제 금액 (최근 14일)
            </h2>
            <AdminLineChart
              data={timeline.payments.map((p) => ({
                ...p,
                label: p.date.slice(5),
              }))}
              xDataKey="label"
              yDataKey="amount"
              yTickFormatter={(v) =>
                v >= 10000 ? `${(v / 10000).toFixed(0)}만` : String(v)
              }
              tooltipLabel="결제액"
              labelPrefix="날짜"
              tooltipValueFormatter={(v) => formatPrice(v) + '원'}
              height={280}
              emptyMessage="결제 데이터가 없습니다."
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-main mb-4">
              일별 신규 유저 (최근 14일)
            </h2>
            <AdminLineChart
              data={timeline.users.map((u) => ({
                ...u,
                label: u.date.slice(5),
              }))}
              xDataKey="label"
              yDataKey="count"
              tooltipLabel="신규 가입"
              labelPrefix="날짜"
              tooltipValueFormatter={(v) => v.toLocaleString() + '명'}
              height={280}
              emptyMessage="유저 데이터가 없습니다."
            />
          </div>
        </div>
      )}
      {isTimelineLoading && (
        <div className="mt-10 h-[280px] rounded-2xl bg-bg-card border border-border-main animate-pulse" />
      )}
    </div>
      )}
    </AdminQueryState>
  );
}
