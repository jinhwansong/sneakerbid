import type { GetMainAuctionsResponse, LiveStatsResponse } from '@/types/auction';

export const EMPTY_MAIN: GetMainAuctionsResponse = { ongoing: [] };

export const DEFAULT_STATS: LiveStatsResponse = {
  activeBidders: 0,
  activeAuctions: 0,
  volume24h: 0,
  avgBidSpeedSeconds: 0.8,
};
