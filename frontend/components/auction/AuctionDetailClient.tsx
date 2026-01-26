'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { AuctionItem } from '@/types/auction';
import { Button } from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import PriceTrendChart, {
  type PriceHistory,
} from '@/components/auction/PriceChart';
import BidCard from '@/components/auction/BidCard';
import { useCountdown } from '@/hooks/useCountdown';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

interface BidLogItem {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
}

interface AuctionDetailClientProps {
  item: AuctionItem;
}

const BID_STEP = 10000;

// 시작가 계산 (현재가의 70%로 추정, 실제로는 서버에서 제공해야 함)
const calculateStartPrice = (currentBid: number) => {
  return Math.floor(currentBid * 0.7);
};

// 차트용 가격 히스토리 생성 (실제로는 서버에서 받아와야 함)
const generatePriceHistory = (
  startPrice: number,
  currentPrice: number,
  count: number = 20,
): PriceHistory[] => {
  const history: PriceHistory[] = [];
  const priceDiff = currentPrice - startPrice;
  const step = priceDiff / count;

  for (let i = 0; i <= count; i++) {
    const price = Math.floor(startPrice + step * i);
    const minutesAgo = count - i;
    const time = minutesAgo === 0 ? '현재' : `${minutesAgo}분 전`;
    history.push({ time, price });
  }

  return history.reverse();
};

export default function AuctionDetailClient({
  item,
}: AuctionDetailClientProps) {
  const startPrice = useMemo(
    () => calculateStartPrice(item.currentBid),
    [item.currentBid],
  );
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [participants, setParticipants] = useState(item.participants);
  const [bidHistory, setBidHistory] = useState<BidLogItem[]>([
    {
      id: 'b1',
      user: 'Guest_312',
      amount: item.currentBid,
      time: '방금 전',
      isBot: false,
    },
    {
      id: 'b2',
      user: 'Guest_907',
      amount: item.currentBid - 5000,
      time: '1분 전',
      isBot: true,
    },
    {
      id: 'b3',
      user: 'Guest_124',
      amount: item.currentBid - 10000,
      time: '2분 전',
      isBot: false,
    },
    {
      id: 'b4',
      user: 'Guest_552',
      amount: item.currentBid - 15000,
      time: '3분 전',
      isBot: true,
    },
    {
      id: 'b5',
      user: 'Guest_044',
      amount: item.currentBid - 20000,
      time: '4분 전',
      isBot: false,
    },
  ]);
  const [bidAmount, setBidAmount] = useState(item.currentBid + BID_STEP);
  const [bidError, setBidError] = useState('');
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(() =>
    generatePriceHistory(startPrice, currentPrice),
  );

  const { countdownLabel, isExpired } = useCountdown(item.endTime);

  // 입찰 히스토리를 금액 내림차순으로 정렬 (같으면 최신순)
  const sortedBidHistory = useMemo(() => {
    return [...bidHistory].sort((a, b) => {
      // 금액이 다르면 금액 내림차순
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      // 금액이 같으면 최신순 (time이 '방금 전'이면 가장 최신)
      if (a.time === '방금 전' && b.time !== '방금 전') return -1;
      if (b.time === '방금 전' && a.time !== '방금 전') return 1;
      // 둘 다 '방금 전'이 아니면 id로 비교 (최신 id가 더 큼)
      return (
        parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''))
      );
    });
  }, [bidHistory]);

  // 현재가는 정렬된 히스토리의 최고가와 연동
  const currentPriceFromHistory = useMemo(() => {
    return sortedBidHistory.length > 0
      ? sortedBidHistory[0].amount
      : currentPrice;
  }, [sortedBidHistory, currentPrice]);

  // 실제 표시할 현재가 (히스토리 최고가와 기존 currentPrice 중 큰 값)
  const displayCurrentPrice = useMemo(() => {
    return Math.max(currentPrice, currentPriceFromHistory);
  }, [currentPrice, currentPriceFromHistory]);

  const priceIncrease = displayCurrentPrice - startPrice;
  const priceIncreasePercent = useMemo(() => {
    if (startPrice === 0) return 0;
    return (((displayCurrentPrice - startPrice) / startPrice) * 100).toFixed(1);
  }, [displayCurrentPrice, startPrice]);

  const minBid = displayCurrentPrice + BID_STEP;

  // 실시간 업데이트 시뮬레이션 제거 (UI만 표시)
  const handleBid = () => {
    if (bidAmount < minBid) {
      setBidError(`현재가보다 높은 금액(${formatPrice(minBid)})만 가능합니다.`);
      return;
    }

    setBidError('');
    setParticipants((prev) => prev + 1);

    const timestamp = Date.now();
    const newBid: BidLogItem = {
      id: `bid-${timestamp}`,
      user: '나 (게스트)',
      amount: bidAmount,
      time: '방금 전',
      isBot: false,
    };

    setBidHistory((prev) => {
      const updated = [newBid, ...prev];
      // 항상 5개로 고정
      return updated.slice(0, 5);
    });

    // 현재가 업데이트
    setCurrentPrice(bidAmount);
    setPriceHistory((prev) => [
      ...prev.slice(1),
      { time: '현재', price: bidAmount },
    ]);
    setBidAmount(bidAmount + BID_STEP);
  };

  const isAuctionActive = item.status !== 'closed';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12">
      <div className="space-y-6">
        <div className="relative aspect-square bg-bg-sub rounded-2xl overflow-hidden group">
          <Image
            src={item.imageUrl || '/placeholder.svg'}
            alt={item.modelName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
          />

          {/* 경매 상태 배지 */}
          <div className="absolute top-4 left-4 z-10">
            <Badge status={item.status} />
          </div>

          {/* 남은 시간 타이머 */}
          <div className="absolute top-4 right-4 z-10">
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md',
                item.status === 'ending_soon'
                  ? 'bg-status-urgent/90 text-white'
                  : item.status === 'closed'
                    ? 'bg-text-muted/90 text-white'
                    : 'bg-text-main/60 text-white',
              )}
            >
              <Clock size={16} />
              <span className="text-sm font-bold tabular-nums">
                {isAuctionActive && !isExpired ? countdownLabel : '종료됨'}
              </span>
            </div>
          </div>
        </div>
        <PriceTrendChart data={priceHistory} />
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border-main">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-text-main border-b-2 border-text-main leading-none pb-0.5">
                    {item.brand}
                  </span>
                  <span className="text-[12px] text-text-muted font-medium tracking-tight">
                    MODEL NO: {item.id}
                  </span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-text-main tracking-tighter leading-tight">
                  {item.modelName}
                </h2>
              </div>

              {/* 현재 입찰가 영역 */}
              <div className="pt-6 border-t border-border-main flex flex-col gap-1">
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  현재 입찰가
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-black tracking-tighter text-text-main tabular-nums">
                    {formatPrice(displayCurrentPrice)}
                  </span>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base font-bold text-brand-primary tabular-nums">
                      ▲ {formatPrice(priceIncrease)}
                    </span>
                    <span className="text-[13px] font-extrabold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                      {priceIncreasePercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border-main">
            <div className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-3 font-semibold">
                  <label className="text-xs text-text-muted flex justify-between">
                    입찰 금액 (KRW)
                    <span className="text-text-main font-black">
                      MIN BID: {formatPrice(minBid)}
                    </span>
                  </label>

                  {/* 하단 보더형 인풋 */}
                  <div className="relative group">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || minBid;
                        setBidAmount(value);
                        setBidError('');
                      }}
                      min={minBid}
                      step={BID_STEP}
                      className="w-full py-4 text-4xl font-black border-b-[3px] border-border-main text-text-main transition-colors hover:border-border-sub focus:border-border-sub"
                      placeholder={minBid.toString()}
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xl font-black text-text-main">
                      원
                    </div>
                  </div>
                </div>

                {/* 빠른 입찰 단위 버튼 (Small & Clean) */}
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 10000, 50000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setBidAmount((prev) => (prev || minBid) + amount);
                        setBidError('');
                      }}
                    >
                      +
                      {amount >= 10000
                        ? `${amount / 10000}만`
                        : `${amount / 1000}천`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 에러 피드백 */}
              {bidError && (
                <div className="p-4 bg-status-urgent/10 rounded-2xl border border-status-urgent/30 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[13px] font-bold text-status-urgent flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-status-urgent rounded-full animate-pulse" />
                    {bidError}
                  </p>
                </div>
              )}

              {/* 메인 액션 버튼 */}
              <div className="space-y-4">
                <Button
                  onClick={handleBid}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!isAuctionActive}
                  
                >
                  {isAuctionActive ? '즉시 입찰하기' : '종료된 경매'}
                </Button>

                <p className="text-[11px] text-center text-text-muted font-medium leading-relaxed tracking-tight">
                  입찰은 취소가 불가능하며 낙찰 시{' '}
                  <span className="text-text-sub font-bold">자동 결제</span>
                  됩니다.
                  <br />
                  신중하게 결정 후 입찰에 참여해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5  rounded-xl border border-border-main">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-main flex items-center gap-2">
              입찰 히스토리 <span className="text-text-muted text-xs font-medium">{participants}명 참여 중</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-status-urgent rounded-full animate-pulse"></span>
              <span className="text-xs text-text-muted">실시간</span>
            </div>
          </div>
          <div className="space-y-2">
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
      </div>
    </div>
  );
}
