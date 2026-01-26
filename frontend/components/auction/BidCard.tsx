'use client';

import { Bot, User } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

interface BidLogItem {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
}

interface BidCardProps {
  bid: BidLogItem;
  rank: number;
  isHighest: boolean;
}

const maskUser = (user: string) => {
  if (user.length <= 3) return `${user[0]}**`;
  return `${user.slice(0, 2)}***`;
};

export default function BidCard({ bid, rank, isHighest }: BidCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
        isHighest
          ? "border-brand-primary/50 bg-brand-primary/10"
          : "border-border-main bg-bg-sub hover:bg-bg-main"
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm",
          isHighest 
            ? "bg-brand-primary text-white" 
            : "bg-bg-card text-text-muted"
        )}
      >
        {isHighest ? '1' : rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
            bid.isBot 
              ? "bg-brand-primary/20 text-brand-primary"
              : "bg-brand-primary/10 text-brand-primary"
          )}>
            {bid.isBot ? (
              <Bot size={12} />
            ) : (
              <User size={12} />
            )}
          </div>
          <span className="font-medium text-text-main text-sm truncate">
            {bid.user === '나 (게스트)' ? bid.user : maskUser(bid.user)}
          </span>
          {bid.isBot && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-primary font-medium">
              봇
            </span>
          )}
          {isHighest && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary text-white font-medium">
              TOP
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className={cn(
            "text-base font-bold",
            isHighest ? "text-brand-primary" : "text-text-main"
          )}>
            {formatPrice(bid.amount)}
          </span>
          <span className="text-xs text-text-muted">{bid.time}</span>
        </div>
      </div>
    </div>
  );
}
