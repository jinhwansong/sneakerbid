export const queryKeys = {
  me: ['me'] as const,
  auctions: {
    main: ['auctions', 'main'] as const,
    list: (query: Record<string, unknown>) =>
      ['auctions', 'list', query] as const,
    history: (query?: { period?: string; search?: string }) =>
      ['auctions', 'history', query] as const,
  },
} as const;
