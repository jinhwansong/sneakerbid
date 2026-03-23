/** KicksDB StockX API 응답 */
export interface KicksDBProduct {
  id: string;
  title: string;
  brand: string;
  model: string;
  description?: string;
  image: string;
  sku?: string;
  slug: string;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  primary_title?: string;
  secondary_title?: string;
}

export interface KicksDBListResponse {
  data: KicksDBProduct[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
  };
}
