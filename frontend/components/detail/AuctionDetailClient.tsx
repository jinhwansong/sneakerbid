'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BidLogItem } from '@/types/auction';
import type { AuctionItem } from '@/types/auction';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuctionEvents } from '@/hooks/useAuctionEvents';
import type { AuctionClosedPayload } from '@/types/events';
import { useMe } from '@/hooks/query/useMe';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/util/format';
import { useToastStore } from '@/store/useToastStore';
import { api } from '@/lib/api';
import {
  updateMainCacheAuctionBid,
  updateListCacheAuctionBid,
} from '@/lib/util/mainCacheUpdater';
import { sortBidHistory } from '@/lib/util/bidHistory';
import {
  DetailProductImage,
  DetailProductInfo,
  DetailBidControl,
  DetailBidHistory,
} from '@/components/detail';
import DetailSkeleton from '@/components/skeleton/DetailSkeleton';
import PaymentFlowModal from '@/components/common/PaymentFlowModal';
import {
  useAuctionDetail,
  useAuctionClosedCacheInvalidation,
} from '@/hooks/query/useAuctionDetail';
import type { AuctionDetailData } from '@/hooks/query/useAuctionDetail';
import { usePlaceBid } from '@/hooks/query/useMainAuctions';

interface AuctionDetailClientProps {
  auctionId: string;
}

const DEFAULT_BID_STEP = 10000;

/** 경매 상태: active(진행중) | closed(종료) */
type AuctionStatus = 'active' | 'closed';

export default function AuctionDetailClient({
  auctionId,
}: AuctionDetailClientProps) {
  const { data, isLoading, error } = useAuctionDetail(auctionId);
  const item = data?.auction;

  if (isLoading || !item) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="text-center py-16 text-destructive">
        경매 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <AuctionDetailContent auctionId={auctionId} item={item} data={data!} />
  );
}

interface AuctionDetailContentProps {
  auctionId: string;
  item: AuctionItem;
  data: AuctionDetailData;
}

function AuctionDetailContent({
  auctionId,
  item,
  data,
}: AuctionDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  const showToast = useToastStore((s) => s.showToast);
  const placeBid = usePlaceBid();
  const invalidateOnClosed = useAuctionClosedCacheInvalidation();

  const bidStep = item.minimumIncrement ?? DEFAULT_BID_STEP;
  const [currentPrice, setCurrentPrice] = useState(item.currentBid);
  const [participants, setParticipants] = useState(item.participants);
  const [bidHistory, setBidHistory] = useState<BidLogItem[]>(
    () => data.bids ?? [],
  );
  const [bidAmount, setBidAmount] = useState(
    item.currentBid + (item.minimumIncrement ?? DEFAULT_BID_STEP),
  );
  const [bidError, setBidError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [closedPayload, setClosedPayload] = useState<AuctionClosedPayload | null>(
    null,
  );

  const { countdownLabel, isExpired } = useCountdown(item.endTime);

  const auctionStatus: AuctionStatus = useMemo(() => {
    if (item.status === 'closed' || item.status === 'failed' || item.status === 'buy_now')
      return 'closed';
    if (isExpired) return 'closed';
    if (closedPayload) return 'closed';
    return 'active';
  }, [item.status, isExpired, closedPayload]);

  const isAuctionActive = auctionStatus === 'active';

  const requireLogin = useCallback(() => {
    showToast('로그인이 필요합니다.', 'error');
    router.push('/login');
  }, [router, showToast]);

  /** 실시간 입찰 이벤트 처리 (타인 입찰 시 메인/리스트 캐시도 갱신 → 뒤로가기 시 최신가 반영) */
  const handleNewBidFromSSE = useCallback(
    (bid: BidLogItem) => {
      setBidHistory((prev) => [bid, ...prev].slice(0, 5));
      setCurrentPrice(bid.amount);
      setParticipants((prev) => prev + 1);
      updateMainCacheAuctionBid(queryClient, auctionId, bid.amount, 1);
      updateListCacheAuctionBid(queryClient, auctionId, bid.amount, 1);
    },
    [auctionId, queryClient],
  );

  /** auctionClosed 이벤트 처리 */
  const handleAuctionClosed = useCallback(
    (payload: AuctionClosedPayload) => {
      setClosedPayload(payload);
      setCurrentPrice(payload.finalPrice);
      showToast('경매가 종료되었습니다.', 'success');
      invalidateOnClosed();
    },
    [showToast, invalidateOnClosed],
  );

  /** 실시간 입찰/종료 이벤트 구독 */
  useAuctionEvents({
    auctionId,
    isActive: isAuctionActive,
    onNewBid: handleNewBidFromSSE,
    onAuctionClosed: handleAuctionClosed,
  });

  /** 입찰 내역 정렬 */
  const sortedBidHistory = useMemo(
    () => sortBidHistory(bidHistory),
    [bidHistory],
  );

  /** 현재 가격 (입찰 내역에서 가장 높은 가격) */
  const currentPriceFromHistory = useMemo(() => {
    return sortedBidHistory.length > 0
      ? sortedBidHistory[0].amount
      : currentPrice;
  }, [sortedBidHistory, currentPrice]);

  /** 표시할 현재 가격 */
  const displayCurrentPrice = useMemo(() => {
    return Math.max(currentPrice, currentPriceFromHistory);
  }, [currentPrice, currentPriceFromHistory]);

  /** 현재 가격 증가 비율 (백엔드 startPrice 기준, 실시간 가격 반영) */
  const priceIncreasePercent = useMemo(() => {
    const start = item.startPrice ?? 0;
    if (start === 0) return item.priceIncreasePercent ?? '0';
    return (((displayCurrentPrice - start) / start) * 100).toFixed(1);
  }, [displayCurrentPrice, item.startPrice, item.priceIncreasePercent]);

  const minBid = displayCurrentPrice + bidStep;

  /** 입찰하기 (낙관적 업데이트) */
  const handleBid = async () => {
    if (!user) {
      requireLogin();
      return;
    }
    if (bidAmount < minBid) {
      const msg = `현재가보다 높은 금액(${formatPrice(minBid)})만 가능합니다.`;
      setBidError(msg);
      showToast(msg, 'error');
      return;
    }
    if (user.balance < bidAmount) {
      const msg = '잔액이 부족합니다.';
      setBidError(msg);
      showToast(msg, 'error');
      return;
    }

    setBidError('');

    /** 낙관적 업데이트: 즉시 가격 반영 (bidHistory·participants는 SSE newBid로 갱신) */
    const prevPrice = currentPrice;
    const prevBidAmount = bidAmount;

    setCurrentPrice(bidAmount);
    setBidAmount(bidAmount + bidStep);

    try {
      const res = await placeBid.mutateAsync({ auctionId, amount: bidAmount });
      setCurrentPrice(res.currentPrice);
      setBidAmount(res.currentPrice + bidStep);
      showToast('입찰이 완료되었습니다.');
    } catch (err) {
      /** 실패 시 조건부 롤백: SSE로 갱신된 상태는 유지, 낙관적 업데이트만 되돌림 */
      setCurrentPrice((prev) => (prev === bidAmount ? prevPrice : prev));
      setBidAmount((prev) => (prev === prevBidAmount + bidStep ? prevBidAmount : prev));
      const msg = err instanceof Error ? err.message : '입찰에 실패했습니다.';
      const displayMsg =
        msg.includes('로그인') || msg.includes('401')
          ? '로그인이 필요합니다.'
          : msg;
      setBidError(displayMsg);
      showToast(displayMsg, 'error');
    }
  };

  /** 즉시 구매 모달 열기 */
  const handleBuyNowClick = () => {
    if (!user) {
      requireLogin();
      return;
    }
    if (!item.buyNowPrice) return;
    setPaymentModalOpen(true);
  };

  /** 결제 플로우 실행 (모달 내부에서 호출) */
  const handlePaymentConfirm = async (
    setStep: (s: 'confirm' | 'creating' | 'paying' | 'complete' | 'error') => void,
  ) => {
    if (!item.buyNowPrice) return { success: false };
    setStep('creating');
    const res = await api.orders.buyNow(auctionId);
    if (!res.orderId) return { success: false };
    setStep('paying');
    const payRes = await api.orders.pay(res.orderId);
    router.refresh();
    return { success: payRes.status === 'PAID' };
  };

  /** 입찰 금액 변경 */
  const handleBidAmountChange = (value: number) => {
    setBidAmount(value);
    setBidError('');
  };

  /** 표시용 상태 (auctionClosed 반영) */
  const displayStatus = useMemo(() => {
    if (closedPayload) {
      return closedPayload.status === 'buy_now' ? 'buy_now' : 'closed';
    }
    return item.status;
  }, [closedPayload, item.status]);

  const timerStatus = useMemo(() => {
    if (!isAuctionActive) return 'closed';
    if (item.status === 'ending_soon') return 'urgent';
    return 'normal';
  }, [isAuctionActive, item.status]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-16">
      <div className="space-y-6">
        <DetailProductImage
          item={{ ...item, status: displayStatus }}
          countdownLabel={countdownLabel}
          timerStatus={timerStatus}
          isAuctionActive={isAuctionActive}
          isExpired={!isAuctionActive}
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
          onBuyNow={handleBuyNowClick}
        />
        <DetailBidHistory
          bidHistory={sortedBidHistory}
          participants={participants}
        />
      </div>

      <PaymentFlowModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        price={item.buyNowPrice ?? 0}
        modelName={item.modelName}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}


