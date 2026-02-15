'use client';

import React, { useMemo, useState } from 'react';
import { AuctionItem, BidLogItem } from '@/types/auction';
import { useCountdown } from '@/hooks/useCountdown';
import { formatPrice } from '@/lib/format';
import {
  DetailProductImage,
  DetailProductInfo,
  DetailBidControl,
  DetailBidHistory,
} from '@/components/detail';

interface AuctionDetailClientProps {
  item: AuctionItem;
}

const BID_STEP = 10000;

const calculateStartPrice = (currentBid: number) => {
  return Math.floor(currentBid * 0.7);
};

const createInitialBidHistory = (item: AuctionItem): BidLogItem[] => [
  { id: 'b1', user: 'Guest_312', amount: item.currentBid, time: '방금 전', isBot: false },
  { id: 'b2', user: 'Guest_907', amount: item.currentBid - 5000, time: '1분 전', isBot: true },
  { id: 'b3', user: 'Guest_124', amount: item.currentBid - 10000, time: '2분 전', isBot: false },
  { id: 'b4', user: 'Guest_552', amount: item.currentBid - 15000, time: '3분 전', isBot: true },
  { id: 'b5', user: 'Guest_044', amount: item.currentBid - 20000, time: '4분 전', isBot: false },
];

export default function AuctionDetailClient({
  item,
}: AuctionDetailClientProps) {
  const startPrice = useMemo(
    () => calculateStartPrice(item.currentBid),
    [item.currentBid],
  );
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [participants, setParticipants] = useState(item.participants);
  const [bidHistory, setBidHistory] = useState<BidLogItem[]>(() =>
    createInitialBidHistory(item),
  );
  const [bidAmount, setBidAmount] = useState(item.currentBid + BID_STEP);
  const [bidError, setBidError] = useState('');

  const { countdownLabel, isExpired } = useCountdown(item.endTime);

  const sortedBidHistory = useMemo(() => {
    return [...bidHistory].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      if (a.time === '방금 전' && b.time !== '방금 전') return -1;
      if (b.time === '방금 전' && a.time !== '방금 전') return 1;
      return parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''));
    });
  }, [bidHistory]);

  const currentPriceFromHistory = useMemo(() => {
    return sortedBidHistory.length > 0
      ? sortedBidHistory[0].amount
      : currentPrice;
  }, [sortedBidHistory, currentPrice]);

  const displayCurrentPrice = useMemo(() => {
    return Math.max(currentPrice, currentPriceFromHistory);
  }, [currentPrice, currentPriceFromHistory]);

  const priceIncreasePercent = useMemo(() => {
    if (startPrice === 0) return '0';
    return (((displayCurrentPrice - startPrice) / startPrice) * 100).toFixed(1);
  }, [displayCurrentPrice, startPrice]);

  const minBid = displayCurrentPrice + BID_STEP;

  const handleBid = () => {
    if (bidAmount < minBid) {
      setBidError(`현재가보다 높은 금액(${formatPrice(minBid)})만 가능합니다.`);
      return;
    }

    setBidError('');
    setParticipants((prev) => prev + 1);

    const newBid: BidLogItem = {
      id: `bid-${Date.now()}`,
      user: '나 (게스트)',
      amount: bidAmount,
      time: '방금 전',
      isBot: false,
    };

    setBidHistory((prev) => [newBid, ...prev].slice(0, 5));
    setCurrentPrice(bidAmount);
    setBidAmount(bidAmount + BID_STEP);
  };

  const handleBuyNow = () => {
    if (!item.buyNowPrice) return;
    if (!confirm(`${formatPrice(item.buyNowPrice)}원에 즉시 구매하시겠습니까?`)) {
      return;
    }
    alert('즉시 구매가 완료되었습니다.');
  };

  const handleBidAmountChange = (value: number) => {
    setBidAmount(value);
    setBidError('');
  };

  const isAuctionActive = item.status !== 'closed';

  const timerStatus = useMemo(() => {
    if (item.status === 'closed' || isExpired) return 'closed';
    if (item.status === 'ending_soon') return 'urgent';
    return 'normal';
  }, [item.status, isExpired]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16">
      <div className="space-y-6">
        <DetailProductImage
          item={item}
          countdownLabel={countdownLabel}
          timerStatus={timerStatus}
          isAuctionActive={isAuctionActive}
          isExpired={isExpired}
        />
        <DetailProductInfo item={item} />
      </div>

      <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2">
        <DetailBidControl
          item={item}
          displayCurrentPrice={displayCurrentPrice}
          priceIncreasePercent={priceIncreasePercent}
          minBid={minBid}
          bidAmount={bidAmount}
          bidError={bidError}
          isAuctionActive={isAuctionActive}
          onBidAmountChange={handleBidAmountChange}
          onBid={handleBid}
          onBuyNow={handleBuyNow}
        />
        <DetailBidHistory bidHistory={bidHistory} participants={participants} />
      </div>
    </div>
  );
}
