import type { AuctionHistoryQuery, AuctionHistoryResponse, AuctionListQuery, AuctionSummary, BidLogItem, CreateAuctionDto, CreateAuctionResponse, DeleteAuctionResponse, GetAuctionListResponse, GetAuctionResponse, GetMainAuctionsResponse, LiveStatsResponse, PlaceBidResponse, UpdateAuctionDto, UpdateAuctionResponse } from '@/types/auction';
import { apiClient } from './client';

/** 경매 관련 API */
export const auctions = {
  /** 메인 경매 목록 */
  getMain: () => apiClient.get<GetMainAuctionsResponse>('/auctions/main'),

  /** 실시간 마켓 지표 (LiveStats) */
  getStats: () => apiClient.get<LiveStatsResponse>('/auctions/stats'),

  /** 거래 내역 */
  getHistory: (query?: AuctionHistoryQuery) => {
    const params = new URLSearchParams();
    if (query?.period) params.append('period', query.period);
    if (query?.search) params.append('search', query.search);
    if (query?.limit) params.append('limit', query.limit.toString());
    const queryString = params.toString();
    return apiClient.get<AuctionHistoryResponse>(
      `/auctions/history${queryString ? `?${queryString}` : ''}`,
    );
  },

  /** 경매 목록 (필터/페이지네이션) */
  getList: (query?: AuctionListQuery) => {
    const params = new URLSearchParams();
    if (query?.brand) params.append('brand', query.brand);
    if (query?.size) params.append('size', query.size);
    if (query?.status) params.append('status', query.status);
    if (query?.sort) params.append('sort', query.sort);
    if (query?.afterId) params.append('afterId', query.afterId);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    const queryString = params.toString();
    return apiClient.get<GetAuctionListResponse>(
      `/auctions${queryString ? `?${queryString}` : ''}`,
    );
  },

  /** 내 입찰 경매 목록 (status: ongoing | closed | all) */
  getMyBidding: (status?: 'ongoing' | 'closed' | 'all') => {
    const params = new URLSearchParams();
    if (status && status !== 'ongoing') params.append('status', status);
    const queryString = params.toString();
    return apiClient.get<AuctionSummary[]>(
      `/auctions/me/bidding${queryString ? `?${queryString}` : ''}`,
    );
  },

  /** 내 경매 등록 목록 */
  getMySelling: (status?: 'all' | 'ongoing' | 'closed') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    const queryString = params.toString();
    return apiClient.get<AuctionSummary[]>(
      `/auctions/me/selling${queryString ? `?${queryString}` : ''}`,
    );
  },

  /** 경매 상세 조회 (init.headers: 서버 prefetch 시 쿠키 전달용) */
  get: (id: string, init?: Pick<RequestInit, 'headers'>) =>
    apiClient.get<GetAuctionResponse>(`/auctions/${id}`, undefined, init),

  /** 입찰 목록 조회 */
  getBids: (auctionId: string, init?: Pick<RequestInit, 'headers'>) =>
    apiClient.get<BidLogItem[]>(`/auctions/${auctionId}/bids`, undefined, init),

  /** 경매 등록 */
  create: (dto: CreateAuctionDto) =>
    apiClient.post<CreateAuctionResponse>(`/auctions`, dto),

  /** 경매 수정 */
  update: (id: string, dto: UpdateAuctionDto) =>
    apiClient.patch<UpdateAuctionResponse>(`/auctions/${id}`, dto),

  /** 경매 삭제 */
  delete: (id: string) =>
    apiClient.delete<DeleteAuctionResponse>(`/auctions/${id}`),

  /** 입찰하기 */
  placeBid: (auctionId: string, bidPrice: number) =>
    apiClient.post<PlaceBidResponse>(`/auctions/${auctionId}/bids`, {
      bidPrice,
    }),
};
