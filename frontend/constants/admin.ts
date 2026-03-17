import {
  Wallet,
  ShoppingCart,
  Gavel,
  Clock,
  TrendingUp,
  XCircle,
  Percent,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { formatPrice } from '@/lib/util/format';

export type SettlementStatKey =
  | 'totalPaidAmount'
  | 'totalPaidCount'
  | 'totalClosedAuctions'
  | 'totalClosedWithWinner'
  | 'pendingOrders'
  | 'todayPaidAmount'
  | 'todayPaidCount';

export const ADMIN_STAT_CARDS: Array<{
  key: SettlementStatKey;
  label: string;
  icon: LucideIcon;
  format: (v: number) => string;
}> = [
  {
    key: 'totalPaidAmount',
    label: '총 결제 완료 금액',
    icon: Wallet,
    format: (v) => `${formatPrice(v)}원`,
  },
  {
    key: 'totalPaidCount',
    label: '총 결제 완료 건수',
    icon: ShoppingCart,
    format: (v) => `${v.toLocaleString()}건`,
  },
  {
    key: 'totalClosedAuctions',
    label: '종료된 경매 수',
    icon: Gavel,
    format: (v) => `${v.toLocaleString()}건`,
  },
  {
    key: 'totalClosedWithWinner',
    label: '낙찰자 있는 경매',
    icon: TrendingUp,
    format: (v) => `${v.toLocaleString()}건`,
  },
  {
    key: 'pendingOrders',
    label: '결제 대기 주문',
    icon: Clock,
    format: (v) => `${v.toLocaleString()}건`,
  },
  {
    key: 'todayPaidAmount',
    label: '오늘 결제 금액',
    icon: Wallet,
    format: (v) => `${formatPrice(v)}원`,
  },
  {
    key: 'todayPaidCount',
    label: '오늘 결제 건수',
    icon: ShoppingCart,
    format: (v) => `${v.toLocaleString()}건`,
  },
];

export const ADMIN_DERIVED_STAT_ICONS: Record<string, LucideIcon> = {
  유찰수: XCircle,
  유찰률: Percent,
  평균거래액: BarChart3,
  결제전환율: Percent,
};

export function getAdminDerivedStats(data: {
  totalClosedAuctions: number;
  totalClosedWithWinner: number;
  totalPaidAmount: number;
  totalPaidCount: number;
}) {
  const lostCount = data.totalClosedAuctions - data.totalClosedWithWinner;
  const lostRate =
    data.totalClosedAuctions > 0
      ? (lostCount / data.totalClosedAuctions) * 100
      : 0;
  const avgPaidAmount =
    data.totalPaidCount > 0
      ? Math.round(data.totalPaidAmount / data.totalPaidCount)
      : 0;
  const conversionRate =
    data.totalClosedWithWinner > 0
      ? (data.totalPaidCount / data.totalClosedWithWinner) * 100
      : 0;

  return [
    {
      key: '유찰수',
      label: '유찰 수',
      value: lostCount,
      format: (v: number) => `${v.toLocaleString()}건`,
    },
    {
      key: '유찰률',
      label: '유찰률',
      value: lostRate,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      key: '평균거래액',
      label: '평균 거래액',
      value: avgPaidAmount,
      format: (v: number) => `${formatPrice(v)}원`,
    },
    {
      key: '결제전환율',
      label: '결제 전환율',
      value: conversionRate,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
  ];
}
