'use client';

import { Users } from 'lucide-react';
import BidCard from '@/components/auction/BidCard';
import { BidLogItem } from '@/types/auction';

interface DetailBidHistoryProps {
  bidHistory: BidLogItem[];
  participants: number;
}

export default function DetailBidHistory({
  bidHistory,
  participants,
}: DetailBidHistoryProps) {
  const sortedBidHistory = [...bidHistory].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    if (a.time === '방금 전' && b.time !== '방금 전') return -1;
    if (b.time === '방금 전' && a.time !== '방금 전') return 1;
    return parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''));
  });

  return (
    <div className="bg-bg-main p-6 rounded-xl border border-border-main space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
          Live Bids
          <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-sub rounded text-[10px] text-text-muted font-bold">
            <Users size={10} /> {participants}
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-status-urgent rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-status-urgent uppercase tracking-tighter">
            Live
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {sortedBidHistory.map((bid, index) => (
          <BidCard
            key={bid.id}
            bid={bid}
            rank={index + 1}
            isHighest={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
