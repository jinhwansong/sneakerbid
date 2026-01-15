export interface HistoryItem {
  id: string;
  modelName: string;
  brand: string;
  imageUrl: string;
  finalPrice: number;
  date: string;
  status: 'completed' | 'cancelled';
  participants: number;
}
