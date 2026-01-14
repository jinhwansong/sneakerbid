import { AuctionItem } from '@/types/auction';

export const DUMMY_AUCTIONS: AuctionItem[] = [
  {
    id: '1',
    brand: 'Nike',
    modelName: 'Air Jordan 1 Retro High OG "Chicago Reimagined"',
    imageUrl: 'https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1665675338',
    currentBid: 580000,
    buyNowPrice: 720000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours left
    participants: 124,
    status: 'ongoing',
  },
  {
    id: '2',
    brand: 'Adidas',
    modelName: 'Yeezy Boost 350 V2 "Zebra"',
    imageUrl: 'https://images.stockx.com/images/Adidas-Yeezy-Boost-350-V2-Zebra-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1606321670',
    currentBid: 320000,
    endTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 mins left
    participants: 89,
    status: 'ending_soon',
  },
  {
    id: '3',
    brand: 'New Balance',
    modelName: '990v3 MiUSA Teddy Santis Sea Salt',
    imageUrl: 'https://images.stockx.com/images/New-Balance-990v3-MiUSA-Teddy-Santis-Sea-Salt-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1653063004',
    currentBid: 285000,
    buyNowPrice: 350000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours left
    participants: 45,
    status: 'ongoing',
  },
  {
    id: '4',
    brand: 'Nike',
    modelName: 'Dunk Low Retro White Black Panda',
    imageUrl: 'https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1611766850',
    currentBid: 120000,
    endTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Finished
    participants: 562,
    status: 'closed',
  },
  {
    id: '5',
    brand: 'Asics',
    modelName: 'Gel-Kayano 14 Cream Black',
    imageUrl: 'https://images.stockx.com/images/Asics-Gel-Kayano-14-Cream-Black-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1679412140',
    currentBid: 240000,
    buyNowPrice: 280000,
    endTime: new Date(Date.now() + 1000 * 60 * 3).toISOString(), // 3 mins left
    participants: 213,
    status: 'ending_soon',
  },
  {
    id: '6',
    brand: 'Nike',
    modelName: 'Air Force 1 Low \'07 White',
    imageUrl: 'https://images.stockx.com/images/Nike-Air-Force-1-Low-White-07-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1606321745',
    currentBid: 110000,
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days left
    participants: 12,
    status: 'ongoing',
  }
];
