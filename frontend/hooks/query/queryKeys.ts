export const queryKeys = {
  me: ['me'] as const,
  admin: {
    settlement: () => ['admin', 'settlement'] as const,
    timeline: (days?: number) => ['admin', 'timeline', days] as const,
    bots: () => ['admin', 'bots'] as const,
    bidHistory: (auctionId: string, limit?: number) =>
      ['admin', 'bidHistory', auctionId, limit] as const,
  },
  orders: {
    my: ['orders', 'my'] as const,
  },
  wishlist: {
    my: ['wishlist', 'my'] as const,
  },
  notifications: {
    list: () => ['notifications', 'list'] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },
  auctions: {
    main: ['auctions', 'main'] as const,
    stats: ['auctions', 'stats'] as const,
    detail: (id: string) => ['auctions', 'detail', id] as const,
    myBidding: ['auctions', 'myBidding'] as const,
    mySellingPrefix: ['auctions', 'mySelling'] as const,
    mySelling: (status?: string) =>
      ['auctions', 'mySelling', status] as const,
    list: (query: Record<string, unknown>) =>
      ['auctions', 'list', query] as const,
    history: (query?: { period?: string; search?: string }) =>
      ['auctions', 'history', query] as const,
  },
} as const;
