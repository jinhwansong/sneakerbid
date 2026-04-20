export interface PublicReviewsResponse {
  averageRating: number | null;
  count: number;
  items: Array<{
    id: string;
    orderId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
}
