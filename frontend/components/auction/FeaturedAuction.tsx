'use client';
import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, Timer, Users } from 'lucide-react';
import Badge from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useToastStore } from '@/store/useToastStore';
import { useMe } from '@/hooks/query/useMe';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/hooks/query/queryKeys';
import { formatPrice } from '@/lib/format';
import { useRemainingTime } from '@/hooks/useRemainingTime';
import { useAuctionEvents } from '@/hooks/useAuctionEvents';
import { updateMainCacheAuctionBid } from '@/lib/mainCacheUpdater';
import { AuctionItem } from '@/types/auction';

const BID_STEP = 10000;

interface FeaturedAuctionProps {
  item: AuctionItem;
}

export default function FeaturedAuction({
  item,
}: FeaturedAuctionProps) {
  const router = useRouter();
  const [isWatched, setIsWatched] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const { showToast } = useToastStore((state) => state);
  const { data: user } = useMe();
  const queryClient = useQueryClient();
  const remainingTime = useRemainingTime(item.endTime);

  /** SSE 실시간 입찰 구독 - 캐시 갱신 */
  const handleNewBid = useCallback(
    (bid: { amount: number }) => {
      updateMainCacheAuctionBid(queryClient, item.id, bid.amount, 1);
    },
    [queryClient, item.id],
  );
  const handleAuctionClosed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auctions.main });
  }, [queryClient]);

  useAuctionEvents({
    auctionId: item.id,
    isActive: item.status !== 'closed' && item.status !== 'failed' && item.status !== 'buy_now',
    onNewBid: handleNewBid,
    onAuctionClosed: handleAuctionClosed,
  });

  const minBid = item.currentBid + BID_STEP;

  const handleBid = async () => {
    if (item.status === 'closed') return;

    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      router.push('/login');
      return;
    }

    if (user.balance < minBid) {
      showToast('잔액이 부족합니다.', 'error');
      return;
    }

    setIsBidding(true);
    try {
      await api.auctions.placeBid(item.id, minBid);
      showToast('입찰이 완료되었습니다.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auctions.myBidding }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auctions.main }),
        queryClient.invalidateQueries({ queryKey: ['auctions', 'list'] }),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '입찰에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsBidding(false);
    }
  };

  const handleWatch = () => {
    setIsWatched(!isWatched);
    if (!isWatched) {
      showToast('관심 경매 추가 완료');
    } else {
      showToast('관심 경매에서 제거되었습니다.');
    }
  };

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative overflow-hidden rounded-3xl bg-(--deep-navy) min-h-[560px] flex items-center shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-2/3 h-full bg-linear-to-l from-brand-primary/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full flex flex-col lg:flex-row items-center px-8 lg:px-20 py-16 gap-12">
          <div className="w-full lg:w-1/2 flex flex-col gap-10 z-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Badge status="ending_soon" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
                  <Timer size={14} className="text-status-urgent" />
                  <span className="tabular-nums" suppressHydrationWarning>
                    {remainingTime}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-brand-primary font-black text-sm tracking-[0.2em] uppercase">
                  지금 주목받는 모델
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                  {item.modelName.split(' ').slice(0, 3).join(' ')}
                  <br />
                  <span className="text-white/40">
                    {item.modelName.split(' ').slice(3).join(' ')}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  현재 입찰가
                </p>
                <p className="text-4xl font-black text-white tabular-nums tracking-tight">
                  {formatPrice(item.currentBid)}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-status-active">
                  <ArrowUpRight size={14} />
                  <span>+12.5%</span>
                </div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  참여 중인 인원
                </p>
                <p className="text-4xl font-black text-white tabular-nums tracking-tight">
                  {item.participants.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-white/40">
                  <Users size={14} />
                  <span>실시간 접속 중</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleBid}
                variant="secondary"
                size="xl"
                disabled={item.status === 'closed' || isBidding}
                className="px-10 h-16 text-lg rounded-2xl shadow-xl shadow-brand-primary/30"
              >
                {item.status === 'closed'
                  ? '경매 종료'
                  : isBidding
                    ? '입찰 중...'
                    : '지금 바로 입찰하기'}
              </Button>
              <Button
                onClick={handleWatch}
                variant="outline"
                size="xl"
                className={`px-10 h-16 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10 ${isWatched ? 'bg-white/10 border-white/40' : ''}`}
              >
                {isWatched ? '관심 해제' : '관심 경매 추가'}
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative flex items-center justify-center">
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 2, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-full aspect-square max-w-[500px]"
            >
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-[100px] opacity-50" />
              <Image
                src={item.imageUrl}
                alt={item.modelName}
                fill
                className="object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-700"
                priority
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
