'use client';

import { AlertCircle, TrendingUp } from 'lucide-react';
import { AuctionItem } from '@/types/auction';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';

const DEFAULT_BID_STEP = 10000;

interface DetailBidControlProps {
  item: AuctionItem;
  displayCurrentPrice: number;
  priceIncreasePercent: string;
  minBid: number;
  bidAmount: number;
  bidError: string;
  isAuctionActive: boolean;
  onBidAmountChange: (value: number) => void;
  onBid: () => void;
  onBuyNow: () => void;
}

export default function DetailBidControl({
  item,
  displayCurrentPrice,
  priceIncreasePercent,
  minBid,
  bidAmount,
  bidError,
  isAuctionActive,
  onBidAmountChange,
  onBid,
  onBuyNow,
}: DetailBidControlProps) {
  return (
    <div className="bg-bg-main p-6 rounded-xl border border-border-main shadow-card-lg space-y-6">
      <div className="space-y-1.5">
        <span className="inline-block px-2 py-0.5 bg-bg-accent text-text-inverse text-[9px] font-black uppercase tracking-tighter rounded">
          {item.brand}
        </span>
        <h2 className="text-2xl lg:text-3xl font-black text-text-main tracking-tightest leading-tight">
          {item.modelName}
        </h2>
      </div>

      <div className="pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-text-muted uppercase tracking-widest">
            Current Bid
            <div className="flex items-center text-brand-primary">
              <TrendingUp size={10} />
              <span>{priceIncreasePercent}%</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl lg:text-4xl font-black tracking-tightest text-text-main tabular-nums">
              {formatPrice(displayCurrentPrice)}
            </span>
            <span className="text-sm font-black text-text-main">원</span>
          </div>
        </div>

        {item.buyNowPrice && (
          <div className="space-y-1 border-l border-border-subtle pl-4">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Buy Now
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl lg:text-2xl font-black text-text-main tabular-nums">
                {formatPrice(item.buyNowPrice)}
              </span>
              <span className="text-sm font-black text-text-main">원</span>
            </div>
          </div>
        )}
      </div>

      {/* 입찰 폼 */}
      <div className="pt-4 border-t border-border-subtle space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || minBid;
                onBidAmountChange(value);
              }}
              min={minBid}
              step={item.minimumIncrement ?? DEFAULT_BID_STEP}
              className="w-full bg-bg-input px-5 py-3.5 text-2xl font-black rounded-xl border-2 border-transparent focus:border-border-accent focus:bg-bg-main transition-all tabular-nums outline-none"
              placeholder={minBid.toString()}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">
              MIN: {formatPrice(minBid)}
            </div>
          </div>

          <p className="text-[10px] text-text-muted font-bold">
            최소 입찰 단위: {formatPrice(item.minimumIncrement ?? DEFAULT_BID_STEP)}원
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(() => {
              const step = item.minimumIncrement ?? DEFAULT_BID_STEP;
              const formatStep = (n: number) =>
                n >= 10000 ? `${n / 10000}만` : n >= 1000 ? `${n / 1000}천` : String(n);
              const options = [
                { value: minBid, label: `최소` },
                { value: minBid + step, label: `+${formatStep(step)}` },
                { value: minBid + step * 4, label: `+${formatStep(step * 5)}` },
              ];
              return options.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onBidAmountChange(value)}
                  className="py-2.5 rounded-lg border border-border-main text-[10px] font-black hover:bg-bg-accent hover:text-text-inverse transition-all"
                >
                  {label}
                </button>
              ));
            })()}
          </div>
        </div>

        {bidError && (
          <div className="flex items-center gap-2 p-3 bg-status-urgent/5 rounded-lg border border-status-urgent/20 animate-in fade-in zoom-in-95 animate-shake">
            <AlertCircle size={14} className="shrink-0 text-status-urgent" />
            <p className="text-[11px] font-bold text-status-urgent flex-1">
              {bidError}
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex gap-2">
            {item.buyNowPrice && (
              <Button
                onClick={onBuyNow}
                variant="outline"
                size="lg"
                disabled={!isAuctionActive}
                className="flex-1 h-14 text-sm font-black rounded-xl border-2 border-border-accent hover:bg-bg-accent hover:text-text-inverse transition-all active:scale-[0.98]"
              >
                BUY NOW
              </Button>
            )}

            <Button
              onClick={onBid}
              variant="primary"
              size="lg"
              className={cn(
                'h-14 text-sm font-black rounded-xl shadow-card active:scale-[0.98] transition-transform',
                item.buyNowPrice ? 'flex-[1.5]' : 'w-full',
              )}
              disabled={!isAuctionActive}
            >
              {isAuctionActive ? 'PLACE BID' : 'ENDED'}
            </Button>
          </div>

          <p className="text-[9px] text-center text-text-muted font-bold tracking-tight">
            입찰 시 취소 불가 및 낙찰 시{' '}
            <span className="text-text-main underline">자동 결제</span> 동의
          </p>
        </div>
      </div>
    </div>
  );
}
