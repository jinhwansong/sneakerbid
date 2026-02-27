import type { BidLogItem } from '@/types/auction';

export function sortBidHistory(bidHistory: BidLogItem[]): BidLogItem[] {
  return [...bidHistory].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    if (a.time === '방금 전' && b.time !== '방금 전') return -1;
    if (b.time === '방금 전' && a.time !== '방금 전') return 1;
    return (
      parseInt(b.id.replace(/\D/g, ''), 10) -
      parseInt(a.id.replace(/\D/g, ''), 10)
    );
  });
}
