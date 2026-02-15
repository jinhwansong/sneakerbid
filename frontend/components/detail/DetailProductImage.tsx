'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { AuctionItem } from '@/types/auction';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/cn';

interface DetailProductImageProps {
  item: AuctionItem;
  countdownLabel: string;
  timerStatus: 'urgent' | 'closed' | 'normal';
  isAuctionActive: boolean;
  isExpired: boolean;
}

export default function DetailProductImage({
  item,
  countdownLabel,
  timerStatus,
  isAuctionActive,
  isExpired,
}: DetailProductImageProps) {
  return (
    <div className="relative aspect-square bg-bg-placeholder rounded-xl overflow-hidden group">
      <Image
        src={item.imageUrl || '/placeholder.svg'}
        alt={item.modelName}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
        priority
      />

      <div className="absolute top-6 left-6 z-10">
        <Badge status={item.status} />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <div
          className={cn(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-xl shadow-lg transition-all duration-300',
            timerStatus === 'urgent'
              ? 'bg-status-urgent text-white animate-pulse scale-105'
              : timerStatus === 'closed'
                ? 'bg-bg-overlay-muted text-white'
                : 'bg-bg-overlay text-white',
          )}
        >
          <Clock
            size={18}
            className={cn(timerStatus === 'urgent' && 'animate-spin-slow')}
          />
          <span className="text-base font-black tabular-nums tracking-tight ">
            {isAuctionActive && !isExpired ? countdownLabel : 'AUCTION CLOSED'}
          </span>
        </div>
      </div>
    </div>
  );
}
