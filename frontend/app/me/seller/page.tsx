'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useMe } from '@/hooks/query/useMe';
import { useSellerDashboard } from '@/hooks/query/useSellerDashboard';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { formatPrice } from '@/lib/util/format';
import { BarChart3, Eye, Gavel, Percent, TrendingUp } from 'lucide-react';

export default function SellerDashboardPage() {
  const { data: profile, isLoading: meLoading } = useMe();
  const { data: dash, isLoading, isError } = useSellerDashboard(!!profile);

  if (meLoading) return null;
  if (profile === null) return <LoginRequiredPrompt />;
  if (!profile) return null;

  const pct =
    dash?.sellThroughRate != null
      ? `${Math.round(dash.sellThroughRate * 1000) / 10}%`
      : '—';

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            판매자 대시보드
          </h1>
          <p className="mt-1 text-text-sub font-medium">
            등록한 경매의 조회·입찰·매출을 한눈에 확인하세요.
          </p>
          <Link
            href="/me/auctions"
            className="inline-block mt-4 text-sm font-bold text-brand-primary hover:underline"
          >
            내 경매 목록 →
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="text-center text-text-muted py-12">
            대시보드를 불러오지 못했습니다.
          </p>
        )}
        {dash && !isLoading && (
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard
              icon={<Eye className="text-brand-primary" size={20} />}
              label="누적 조회수"
              value={formatPrice(dash.viewCountSum)}
            />
            <StatCard
              icon={<Gavel className="text-brand-primary" size={20} />}
              label="내 경매 입찰 수"
              value={formatPrice(dash.bidCountOnMyAuctions)}
            />
            <StatCard
              icon={<TrendingUp className="text-brand-primary" size={20} />}
              label="결제 완료 매출"
              value={`${formatPrice(dash.revenuePaid)}원`}
            />
            <StatCard
              icon={<Percent className="text-brand-primary" size={20} />}
              label="종료 대비 낙찰 비율"
              value={pct}
              sub={`종료 ${dash.closedAuctionCount}건 · 결제 ${dash.paidOrderCount}건`}
            />
            <StatCard
              icon={<BarChart3 className="text-brand-primary" size={20} />}
              label="등록 경매 수"
              value={String(dash.auctionCount)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-main bg-bg-main p-5 shadow-sm">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-black text-text-main tabular-nums">{value}</p>
      {sub && (
        <p className="mt-1 text-[11px] text-text-muted font-medium">{sub}</p>
      )}
    </div>
  );
}
