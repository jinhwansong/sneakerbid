export type AuctionStatus = 'ongoing' | 'ending_soon' | 'closed';

export interface AuctionItem {
  id: string;
  modelName: string;
  brand: string;
  imageUrl: string;
  currentBid: number;
  buyNowPrice?: number;
  endTime: string; // ISO string
  participants: number;
  status: AuctionStatus;
}
