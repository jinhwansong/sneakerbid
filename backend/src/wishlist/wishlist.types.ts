export interface WishlistToggleResult {
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
  endTime: Date;
  status: string;
  bidCount: number;
  buyNowPrice: number | null;
}

/** Supabase Wishlist + auction + sneaker 조인 결과 */
export interface WishlistEntryRow {
  id: string;
  auctionId: string;
  auction:
    | {
        size: string;
        currentPrice: number;
        endTime: string;
        status: string;
        buyNowPrice: number | null;
        sneaker:
          | { modelName: string; brand: string; imageUrl: string }
          | Array<{ modelName: string; brand: string; imageUrl: string }>;
      }
    | Array<{
        size: string;
        currentPrice: number;
        endTime: string;
        status: string;
        buyNowPrice: number | null;
        sneaker:
          | { modelName: string; brand: string; imageUrl: string }
          | Array<{ modelName: string; brand: string; imageUrl: string }>;
      }>;
}
