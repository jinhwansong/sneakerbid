import { AuctionItem } from '@/types/auction';
import { HistoryItem } from '@/types/history';

export const DUMMY_AUCTIONS: AuctionItem[] = [
  {
    id: '1',
    brand: 'Nike',
    modelName: 'Air Jordan 1 Retro High OG "Chicago"',
    imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop',
    currentBid: 580000,
    buyNowPrice: 720000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours left
    participants: 124,
    status: 'ongoing',
  },
  {
    id: '2',
    brand: 'New Balance',
    modelName: '990v5 MiUSA Gray Classic',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    currentBid: 320000,
    endTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 mins left
    participants: 89,
    status: 'ending_soon',
  },
  {
    id: '3',
    brand: 'Adidas',
    modelName: 'Yeezy Boost 350 V2 Carbon',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    currentBid: 285000,
    buyNowPrice: 350000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours left
    participants: 45,
    status: 'ongoing',
  },
  {
    id: '4',
    brand: 'Nike',
    modelName: 'Dunk Low Retro "Panda"',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    currentBid: 120000,
    endTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Finished
    participants: 562,
    status: 'closed',
  },
  {
    id: '5',
    brand: 'Nike',
    modelName: 'Air Force 1 Low "Triple White"',
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop',
    currentBid: 110000,
    buyNowPrice: 139000,
    endTime: new Date(Date.now() + 1000 * 60 * 3).toISOString(), // 3 mins left
    participants: 213,
    status: 'ending_soon',
  },
  {
    id: '6',
    brand: 'Asics',
    modelName: 'Gel-Kayano 14 Cream Black',
    imageUrl: 'https://images.unsplash.com/photo-1528701800489-20be9c6f5e5b?q=80&w=800&auto=format&fit=crop',
    currentBid: 240000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days left
    participants: 12,
    status: 'ongoing',
  }
];

export const DUMMY_HISTORY: HistoryItem[] = [
  {
    id: '1',
    brand: 'Nike',
    modelName: 'Air Jordan 1 Retro High OG "Chicago"',
    imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop',
    finalPrice: 620000,
    date: '2026.01.14',
    status: 'completed',
    participants: 156,
  },
  {
    id: '2',
    brand: 'New Balance',
    modelName: '990v5 MiUSA Gray Classic',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    finalPrice: 315000,
    date: '2026.01.14',
    status: 'completed',
    participants: 42,
  },
  {
    id: '3',
    brand: 'Adidas',
    modelName: 'Yeezy Boost 350 V2 Carbon',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    finalPrice: 285000,
    date: '2026.01.13',
    status: 'completed',
    participants: 89,
  },
  {
    id: '4',
    brand: 'Nike',
    modelName: 'Dunk Low Retro "Panda"',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    finalPrice: 132000,
    date: '2026.01.12',
    status: 'cancelled',
    participants: 234,
  },
];
