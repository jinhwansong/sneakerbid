'use client'

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Clock, Users, X } from 'lucide-react';
import { AuctionItem } from '@/types/auction';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PriceChartPlaceholder } from '@/components/auction/PriceChartPlaceholder';
import { formatCountdown, formatPrice, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

interface BidLogItem {
  id: string;
  user: string;
  amount: number;
  time: string;
}


interface AuctionDetailClientProps {
  item: AuctionItem;
}

const BID_STEP = 10000;


const maskUser = (user: string) => {
  if (user.length <= 3) return `${user[0]}**`;
  return `${user.slice(0, 2)}***`;
};

const getRemainingSeconds = (endTime: string) =>
  Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));

export const AuctionDetailClient: React.FC<AuctionDetailClientProps> = ({ item }) => {
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [participants, setParticipants] = useState(item.participants);
  const [, setBids] = useState<BidLogItem[]>([
    { id: 'b1', user: 'Guest_312', amount: item.currentBid, time: '방금 전' },
    { id: 'b2', user: 'Guest_907', amount: item.currentBid - 5000, time: '1분 전' },
    { id: 'b3', user: 'Guest_124', amount: item.currentBid - 10000, time: '2분 전' },
    { id: 'b4', user: 'Guest_552', amount: item.currentBid - 15000, time: '3분 전' },
    { id: 'b5', user: 'Guest_044', amount: item.currentBid - 20000, time: '4분 전' },
  ]);
  const [liveFeed, setLiveFeed] = useState<BidLogItem[]>(() => [
    { id: 'f1', user: 'Guest_312', amount: item.currentBid, time: formatTime() },
    { id: 'f2', user: 'Guest_907', amount: item.currentBid - 5000, time: formatTime() },
    { id: 'f3', user: 'Guest_124', amount: item.currentBid - 10000, time: formatTime() },
  ]);
  const [bidAmount, setBidAmount] = useState(item.currentBid + BID_STEP);
  const [bidError, setBidError] = useState('');
  const [autoBidOpen, setAutoBidOpen] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState(item.currentBid + BID_STEP * 10);
  const [autoBidStep, setAutoBidStep] = useState(BID_STEP);

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(item.endTime)
  );
  const countdownLabel = useMemo(
    () => formatCountdown(remainingSeconds),
    [remainingSeconds]
  );
  const minBid = currentPrice + BID_STEP;
  useEffect(() => {
    if (item.status === 'closed') return;

    // Simulated socket.io updates
    const interval = setInterval(() => {
      const delta = Math.random() > 0.6 ? BID_STEP : 0;
      if (delta === 0) return;

      setCurrentPrice((prev) => {
        const next = prev + delta;
        setBids((prevBids) => [
          {
            id: `bid-${Date.now()}`,
            user: `Guest_${Math.floor(Math.random() * 900) + 100}`,
            amount: next,
            time: '방금 전',
          },
          ...prevBids.slice(0, 9),
        ]);
        setLiveFeed((prevFeed) => [
          {
            id: `feed-${Date.now()}`,
            user: `Guest_${Math.floor(Math.random() * 900) + 100}`,
            amount: next,
            time: formatTime(),
          },
          ...prevFeed,
        ].slice(0, 3));
        setBidAmount((prevAmount) => Math.max(prevAmount, next + BID_STEP));
        return next;
      });
      setParticipants((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, [item.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(item.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [item.endTime]);

  const handleBid = () => {
    if (bidAmount < minBid) {
      setBidError(`현재가보다 높은 금액(${formatPrice(minBid)})만 가능합니다.`);
      return;
    }

    setBidError('');
    setCurrentPrice(bidAmount);
    setParticipants((prev) => prev + 1);
    setBids((prev) => [
      {
        id: `bid-${Date.now()}`,
        user: '나 (게스트)',
        amount: bidAmount,
        time: '방금 전',
      },
      ...prev.slice(0, 9),
    ]);
    setLiveFeed((prev) => [
      {
        id: `feed-${Date.now()}`,
        user: '나 (게스트)',
        amount: bidAmount,
        time: formatTime(),
      },
      ...prev,
    ].slice(0, 3));
    setBidAmount(bidAmount + BID_STEP);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
      {/* Left: Gallery & Chart */}
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border-main bg-bg-main p-6">
          <div className="relative aspect-4/3 rounded-md bg-bg-card overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.modelName}
              fill
              className="object-contain p-8 mix-blend-multiply dark:mix-blend-normal"
              priority
            />
          </div>
        </div>

        <div className="rounded-lg border border-border-main bg-bg-main/70 backdrop-blur-md  p-6">
          <div className="flex items-center justify-between mb-3 ">
            <span className="text-sm font-bold text-text-main">
              실시간 입찰 피드
            </span>
            <span className="text-[10px] text-text-muted">LIVE</span>
          </div>
          <div className="flex flex-col gap-2 max-h-[160px] overflow-hidden">
            <AnimatePresence initial={false}>
              {liveFeed.slice(0, 3).map((feed, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-xl bg-bg-sub/70 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-border-main/80" />
                    <div>
                      <p className="text-xs font-bold text-text-main">
                        {maskUser(feed.user)}
                      </p>
                      <p className="text-[10px] text-text-muted">{feed.time}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-text-main tabular-nums">
                    {formatPrice(feed.amount)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-lg border border-border-main bg-bg-main p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-main">
              실시간 가격 추이
            </h2>
            <span className="text-[11px] text-text-muted">24H</span>
          </div>
          <PriceChartPlaceholder />
        </div>
      </div>

      {/* Right: Price & Actions */}
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border-main bg-bg-main p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Badge status={item.status} />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock size={14} />
              <span
                className={cn(
                  'tabular-nums font-semibold',
                  remainingSeconds <= 10 && 'text-status-urgent'
                )}
              >
                {countdownLabel} 남음
              </span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
              {item.brand}
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
              {item.modelName}
            </h1>
          </div>

          <div className="rounded-md bg-bg-sub p-4">
            <p className="text-[11px] font-bold text-text-muted mb-1">
              현재 최고가
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPrice}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-3xl font-black text-text-main tabular-nums"
              >
                {formatPrice(currentPrice)}
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center gap-1 text-[11px] font-bold text-status-active mt-1">
              <ArrowUpRight size={12} />
              <span>실시간 업데이트</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[11px] text-text-sub">
            <div className="rounded-md bg-bg-sub p-4">
              <p className="text-text-muted font-bold mb-1">입찰 단위</p>
              <p className="text-sm font-black text-text-main">
                {formatPrice(BID_STEP)}
              </p>
            </div>
            <div className="rounded-md bg-bg-sub p-4">
              <p className="text-text-muted font-bold mb-1">현재 경매 참여자</p>
              <p className="text-sm font-black text-text-main">
                {participants.toLocaleString()}명
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <Users size={14} />
            <span className="font-medium">{participants}명 참여 중</span>
            <span className="w-1 h-1 bg-border-main rounded-full" />
            <span className="font-medium">게스트 모드 입찰 가능</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border-main bg-bg-main px-4 py-3">
              <p className="text-[11px] font-bold text-text-muted mb-1">
                입찰 금액
              </p>
              <input
                type="number"
                min={minBid}
                step={BID_STEP}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full bg-transparent text-lg font-black text-text-main outline-none tabular-nums no-spinner"
              />
              <p className="text-[10px] text-text-muted mt-1">
                최소 입찰가: {formatPrice(minBid)} (10,000원 단위)
              </p>
              {bidError && (
                <p className="text-[10px] text-status-urgent font-bold mt-1">
                  {bidError}
                </p>
              )}
            </div>
            <Button fullWidth variant="secondary" size="lg" onClick={handleBid}>
              입찰하기
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAutoBidOpen(true)}
            >
              자동 입찰 설정
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border-main bg-bg-main p-6">
          <h3 className="text-sm font-bold text-text-main mb-4">상품 정보</h3>
          <div className="grid grid-cols-1 gap-3 text-[12px] text-text-sub">
            {[
              { label: '모델명', value: item.modelName },
              { label: '브랜드', value: item.brand },
              { label: '사이즈', value: '240 · 250 · 260 · 270 · 280' },
              { label: '발매가', value: formatPrice(189000) },
              { label: '거래 방식', value: '경매(실시간)' },
            ].map((info) => (
              <div
                key={info.label}
                className="flex items-center justify-between border-b border-border-main/50 pb-2"
              >
                <span className="text-text-muted font-semibold">
                  {info.label}
                </span>
                <span className="text-text-main font-semibold">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {autoBidOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAutoBidOpen(false)}
            />
            <motion.div
              className="fixed inset-x-6 bottom-10 z-50 mx-auto max-w-md rounded-lg bg-bg-main border border-border-main p-6 shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-text-main">
                  자동 입찰 설정
                </h3>
                <button
                  onClick={() => setAutoBidOpen(false)}
                  className="text-text-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-md border border-border-main bg-bg-sub px-4 py-3">
                  <p className="text-[11px] font-bold text-text-muted mb-1">
                    최대 입찰가
                  </p>
                  <input
                    type="number"
                    min={minBid}
                    step={BID_STEP}
                    value={autoBidMax}
                    onChange={(e) => setAutoBidMax(Number(e.target.value))}
                    className="w-full bg-transparent text-base font-black text-text-main outline-none tabular-nums"
                  />
                </div>
                <div className="rounded-md border border-border-main bg-bg-sub px-4 py-3">
                  <p className="text-[11px] font-bold text-text-muted mb-1">
                    자동 상승 단위
                  </p>
                  <input
                    type="number"
                    min={BID_STEP}
                    step={BID_STEP}
                    value={autoBidStep}
                    onChange={(e) => setAutoBidStep(Number(e.target.value))}
                    className="w-full bg-transparent text-base font-black text-text-main outline-none tabular-nums"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    현재가 기준으로 자동 입찰을 실행합니다.
                  </p>
                </div>
                <Button
                  fullWidth
                  variant="secondary"
                  size="lg"
                  onClick={() => setAutoBidOpen(false)}
                >
                  자동 입찰 활성화
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
