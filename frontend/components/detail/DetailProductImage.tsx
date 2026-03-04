'use client';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { AuctionItem } from '@/types/auction';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/util/cn';


interface DetailProductImageProps {
  item: AuctionItem;
  countdownLabel: string;
  timerStatus: 'urgent' | 'closed' | 'normal';
  isAuctionActive: boolean;
  isExpired: boolean;
}

/** 찜 버튼 공통 스타일 (상세페이지 기준) */
export const WISHLIST_BUTTON_STYLE = {
  base: 'z-50 flex items-center justify-center rounded-full shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-60',
  default:
    'w-10 h-10 bg-white/90 dark:bg-bg-main/95 border border-border-main/50',
  active: 'bg-status-urgent/20 border-2 border-status-urgent/50',
  icon: {
    default: 'text-text-muted hover:text-status-urgent/70',
    active: 'fill-status-urgent text-status-urgent',
  },
  iconSize: 18,
} as const;

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
