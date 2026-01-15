'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuctionItem } from '@/types/auction';
import { Badge } from '@/components/common/Badge';
import { PriceChartPlaceholder } from './PriceChartPlaceholder';
import { Button } from '@/components/common/Button';
import { Users, Clock } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, formatRemainingTime } from '@/lib/format';

interface AuctionCardProps {
  item: AuctionItem;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ item }) => {
  const showToast = useToastStore((state) => state.showToast);

  const handleBid = () => {
    showToast(`입찰 시작: ${item.modelName}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all"
    >
      <Link href={`/auction/${item.id}`} className="flex flex-col flex-1">
      {/* Status Badge - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <Badge status={item.status} />
      </div>

      {/* Image Container */}
        <div className="aspect-4/3 relative overflow-hidden bg-bg-card">
        <Image
          src={item.imageUrl}
          alt={item.modelName}
          fill
          className="object-contain p-6 mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
        <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
            {item.brand}
          </p>
          <h3 className="text-sm font-medium text-text-main line-clamp-1 leading-snug">
            {item.modelName}
          </h3>
        </div>

        {/* Price Info */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">현재 입찰가</p>
              <p className="text-xl font-black text-text-main tabular-nums tracking-tight">
                {formatPrice(item.currentBid)}
              </p>
            </div>
            {item.buyNowPrice && (
              <div className="text-right">
                <p className="text-[10px] text-text-muted mb-0.5">
                  즉시 구매가
                </p>
                <p className="text-xs font-bold text-brand-primary tabular-nums">
                  {formatPrice(item.buyNowPrice)}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </Link>

      <div className="px-5 pb-5 flex flex-col gap-3">
        {/* Action Button - Immediate Feedback */}
        <Button
          onClick={handleBid}
          variant="primary"
          size="md"
          fullWidth
          disabled={item.status === 'closed'}
        >
          {item.status === 'closed' ? '경매 종료' : '지금 바로 입찰하기'}
        </Button>

        {/* Chart Placeholder */}
        <div className="pt-2">
          <PriceChartPlaceholder />
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-3 border-t border-border-main/50 text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span className="text-[11px] font-medium tabular-nums">
              {formatRemainingTime(item.endTime)} 남음
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span className="text-[11px] font-medium">
              {item.participants}명
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
