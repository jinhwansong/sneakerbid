export interface WishlistToggleResponse {
  isWishlisted: boolean;
}

export interface WishlistItem {
  id: string;
  auctionId: string;
  sneakerName: string;
  brand: string;
  imageUrl: string;
  size: string;
  currentPrice: number;
  endTime: string;
  status: 'OPEN' | 'CLOSED';
  bidCount: number;
  buyNowPrice: number | null;
}
