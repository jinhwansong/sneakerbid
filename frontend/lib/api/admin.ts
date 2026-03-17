import { apiClient } from './client';

export interface SettlementStats {
  totalPaidAmount: number;
  totalPaidCount: number;
  totalClosedAuctions: number;
  totalClosedWithWinner: number;
  pendingOrders: number;
  todayPaidAmount: number;
  todayPaidCount: number;
}

export interface BotItem {
  id: string;
  userId: string;
  type: string;
  enabled?: boolean;
  favoriteBrands: string[] | null;
  activityStartHour: number;
  activityEndHour: number;
}

export interface BidHistoryPoint {
  bidPrice: number;
  createdAt: string;
}

export interface DailyPaymentPoint {
  date: string;
  amount: number;
  count: number;
}

export interface DailyUserPoint {
  date: string;
  count: number;
}

export interface DashboardTimeline {
  payments: DailyPaymentPoint[];
  users: DailyUserPoint[];
  totalUsers: number;
}

export const admin = {
  getSettlement: () =>
    apiClient.get<SettlementStats>('/admin/settlement'),

  getDashboardTimeline: (days?: number) =>
    apiClient.get<DashboardTimeline>(
      '/admin/stats/timeline',
      days != null ? { days } : undefined,
    ),

  getBots: () =>
    apiClient.get<BotItem[]>('/admin/bots'),

  setBotEnabled: (botId: string, enabled: boolean) =>
    apiClient.patch<{ success: boolean }>(`/admin/bots/${botId}/enabled`, {
      enabled,
    }),

  forceCloseAuction: (auctionId: string) =>
    apiClient.post<{ success: boolean }>(
      `/admin/auctions/${auctionId}/force-close`,
    ),

  getBidHistory: (auctionId: string, limit?: number) =>
    apiClient.get<BidHistoryPoint[]>(
      `/admin/auctions/${auctionId}/bid-history`,
      limit != null ? { limit } : undefined,
    ),
};
