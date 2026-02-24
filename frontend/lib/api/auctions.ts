import type { AuctionHistoryQuery, AuctionHistoryResponse, AuctionListQuery, BidLogItem, CreateAuctionDto, CreateAuctionResponse, DeleteAuctionResponse, GetAuctionListResponse, GetAuctionResponse, GetMainAuctionsResponse, PlaceBidResponse, UpdateAuctionDto, UpdateAuctionResponse } from '@/types/auction';
import { Fetcher } from '../fetcher';

/** 경매 관련 API */
export const auctions = {
  /** 메인 경매 목록 */
  getMain: () =>
    Fetcher<GetMainAuctionsResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions/main`),

  /** 거래 내역 */
  getHistory: (query?: AuctionHistoryQuery) => {
    const params = new URLSearchParams();
    if (query?.period) params.append('period', query.period);
    if (query?.search) params.append('search', query.search);
    if (query?.limit) params.append('limit', query.limit.toString());
    const queryString = params.toString();
    return Fetcher<AuctionHistoryResponse>(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/history${queryString ? `?${queryString}` : ''}`,
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
    const queryString = params.toString();
    return Fetcher<GetAuctionListResponse>(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auctions${queryString ? `?${queryString}` : ''}`,
    );
  },

  /** 경매 상세 조회 */
  get: (id: string) =>
    Fetcher<GetAuctionResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions/${id}`),

  /** 입찰 목록 조회 */
  getBids: (auctionId: string) =>
    Fetcher<BidLogItem[]>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions/${auctionId}/bids`),

  /** 경매 등록 */
  create: (dto: CreateAuctionDto) =>
    Fetcher<CreateAuctionResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /** 경매 수정 */
  update: (id: string, dto: UpdateAuctionDto) =>
    Fetcher<UpdateAuctionResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /** 경매 삭제 */
  delete: (id: string) =>
    Fetcher<DeleteAuctionResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/auctions/${id}`, {
      method: 'DELETE',
    }),

  /** 입찰하기 */
  placeBid: (auctionId: string, bidPrice: number) =>
    Fetcher<PlaceBidResponse>(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auctions/${auctionId}/bids`,
      {
        method: 'POST',
        body: JSON.stringify({ bidPrice }),
      },
    ),
};
