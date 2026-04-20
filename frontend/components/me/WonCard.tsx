'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CreditCard, Star } from 'lucide-react';
import { Button } from '@/components/common/Button';
import PaymentFlowModal from '@/components/common/PaymentFlowModal';
import { formatPrice } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/query/queryKeys';
import type { OrderItem } from '@/types/orders';
import { BLUR_PLACEHOLDER } from '@/lib/constants/image';
import { useToastStore } from '@/store/useToastStore';

export default function WonCard({ item }: { item: OrderItem }) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: () =>
      api.orders.createReview(item.id, {
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      setReviewDone(true);
      setReviewOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.my });
      showToast('리뷰가 등록되었습니다.');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '리뷰 등록에 실패했습니다.';
      showToast(msg, 'error');
    },
  });
  const statusConfig = {
    PENDING: {
      label: '결제 대기',
      className: 'bg-status-urgent/10 text-status-urgent',
    },
    PAID: {
      label: '결제 완료',
      className: 'bg-status-active/10 text-status-active',
    },
    CANCELLED: {
      label: '취소됨',
      className: 'bg-text-muted/10 text-text-muted',
    },
    FAILED: {
      label: '결제 실패',
      className: 'bg-status-urgent/10 text-status-urgent',
    },
  } as const;
  const status =
    statusConfig[item.status as keyof typeof statusConfig] ??
    statusConfig.PENDING;

  const auctionHref = `/auction/${item.auctionId}`;

  return (
    <>
      <div className="group flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 transition-all">
        <Link
          href={auctionHref}
          className="flex flex-1 items-center gap-4 min-w-0"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-bg-card rounded-2xl overflow-hidden flex items-center justify-center">
            <Image
              src={item.imageUrl}
              alt={item.sneakerName}
              width={80}
              height={80}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
              {item.brand}
            </p>
            <h3 className="text-sm md:text-base font-bold text-text-main truncate mb-1">
              {item.sneakerName}
            </h3>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-sm md:text-lg font-black text-text-main tabular-nums">
              {formatPrice(item.finalPrice)}
            </p>
          </div>
        </Link>
        <div className="flex flex-col gap-2 shrink-0 items-end">
          {item.status === 'PENDING' ? (
            <Button
              variant="primary"
              size="sm"
              className="gap-1"
              onClick={() => setPaymentModalOpen(true)}
              aria-label="결제하기"
            >
              <CreditCard size={14} />
              결제하기
            </Button>
          ) : null}
          {item.status === 'PAID' && !reviewDone ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setReviewOpen(true)}
              aria-label="거래 리뷰 작성"
            >
              <Star size={14} />
              리뷰
            </Button>
          ) : null}
        </div>
      </div>

      {reviewOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal
          aria-label="리뷰 작성"
        >
          <div className="w-full max-w-md rounded-2xl bg-bg-main border border-border-main p-6 shadow-xl">
            <h3 className="text-lg font-black text-text-main mb-4">거래 리뷰</h3>
            <p className="text-xs text-text-muted mb-3">
              상대방에 대한 평점(1~5)과 선택 코멘트를 남겨 주세요.
            </p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={cn(
                    'p-1 rounded-lg transition-colors',
                    rating >= n ? 'text-brand-primary' : 'text-text-muted',
                  )}
                  aria-label={`${n}점`}
                >
                  <Star size={28} className={rating >= n ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="선택: 거래 경험을 짧게 남겨 주세요"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-border-main bg-bg-input px-3 py-2 text-sm text-text-main placeholder:text-text-muted mb-4 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate()}
              >
                {reviewMutation.isPending ? '등록 중…' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      )}

    <PaymentFlowModal
      isOpen={paymentModalOpen}
      onClose={() => setPaymentModalOpen(false)}
      price={item.finalPrice}
      modelName={item.sneakerName}
      onConfirm={async (setStep) => {
        setStep('paying');
        const payRes = await api.orders.pay(item.id);
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.my });
        return { success: payRes.status === 'PAID' };
      }}
    />
  </>
  );
}
