'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Users, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import Badge from '../common/Badge';
import { WISHLIST_BUTTON_STYLE } from '@/components/detail/DetailProductImage';
import { formatPrice } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';
import { useRemainingTime } from '@/hooks/useRemainingTime';
import { useToastStore } from '@/store/useToastStore';
import { useMe } from '@/hooks/query/useMe';
import { useWishlistToggle } from '@/hooks/query/useMyWishlist';
import { usePlaceBid } from '@/hooks/query/useMainAuctions';
import { AuctionItem } from '@/types/auction';

const DEFAULT_BID_STEP = 10000;

const TERMINAL_STATES = new Set<string>(['closed', 'failed', 'buy_now']);

interface AuctionCardProps {
  item: AuctionItem;
}

export default function AuctionCard({ item }: AuctionCardProps) {
  const router = useRouter();
  const { showToast } = useToastStore((state) => state);
  const { data: user } = useMe();
  const wishlistToggle = useWishlistToggle();
  const placeBid = usePlaceBid();
  const remainingTime = useRemainingTime(item.endTime);

  const bidStep = item.minimumIncrement ?? DEFAULT_BID_STEP;
  const minBid = item.currentBid + bidStep;

  const handleWishlist = async () => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      router.push('/login');
      return;
    }
    try {
      const result = await wishlistToggle.mutateAsync(item.id);
      const next = result?.isWishlisted ?? !(item.isWishlisted ?? false);
      showToast(next ? '관심 경매 추가 완료' : '관심 경매에서 제거되었습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '찜하기에 실패했습니다.';
      showToast(msg, 'error');
    }
  };

  const handleBid = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (TERMINAL_STATES.has(item.status)) return;

    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      router.push('/login');
      return;
    }

    if (user.balance < minBid) {
      showToast('잔액이 부족합니다.', 'error');
      return;
    }

    try {
      await placeBid.mutateAsync({ auctionId: item.id, amount: minBid });
      showToast('입찰이 완료되었습니다.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '입찰에 실패했습니다.';
      showToast(msg, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all"
    >
      <div className="absolute top-4 left-4 z-10">
        <Badge status={item.status} />
      </div>
      {/* 찜 버튼: Link와 분리해 클릭이 fetch로 전달되도록 (z-[100]으로 최상단) */}
      <div className="absolute top-3 right-3 z-100" style={{ isolation: 'isolate' }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWishlist();
          }}
          disabled={
            wishlistToggle.isPending && wishlistToggle.variables === item.id
          }
          className={cn(
            WISHLIST_BUTTON_STYLE.base,
            WISHLIST_BUTTON_STYLE.default,
            item.isWishlisted && WISHLIST_BUTTON_STYLE.active,
          )}
          aria-label={item.isWishlisted ? '찜 해제' : '찜하기'}
        >
          <Heart
            size={WISHLIST_BUTTON_STYLE.iconSize}
            className={`transition-colors duration-200 ${
              item.isWishlisted
                ? WISHLIST_BUTTON_STYLE.icon.active
                : WISHLIST_BUTTON_STYLE.icon.default
            }`}
          />
        </button>
      </div>

      <Link
        href={`/auction/${item.id}`}
        className="flex flex-col flex-1 relative z-0"
      >
        {/* Image Container */}
        <div className="aspect-4/3 relative overflow-hidden bg-bg-card">
          <Image
            src={item.imageUrl}
            alt={item.modelName}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
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
                <p className="text-[10px] text-text-muted mb-0.5">
                  현재 입찰가
                </p>
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
          disabled={TERMINAL_STATES.has(item.status) || placeBid.isPending}
        >
          {TERMINAL_STATES.has(item.status)
            ? '경매 종료'
            : placeBid.isPending
              ? '입찰 중...'
              : '지금 바로 입찰하기'}
        </Button>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-3 border-t border-border-main/50 text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span
              className="text-[11px] font-medium tabular-nums"
              suppressHydrationWarning
            >
              {TERMINAL_STATES.has(item.status) ? '종료' : `${remainingTime} 남음`}
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
}




