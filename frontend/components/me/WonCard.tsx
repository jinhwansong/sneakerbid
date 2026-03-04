'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/common/Button';
import PaymentFlowModal from '@/components/common/PaymentFlowModal';
import { formatPrice } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/query/queryKeys';
import type { OrderItem } from '@/types/orders';

export default function WonCard({ item }: { item: OrderItem }) {
  const queryClient = useQueryClient();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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

  return (
    <>
      <Link
        href={`/auction/${item.auctionId}`}
        className="group flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 transition-all"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-bg-card rounded-2xl overflow-hidden flex items-center justify-center">
          <Image
            src={item.imageUrl}
            alt={item.sneakerName}
            width={80}
            height={80}
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
          {item.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              className="gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPaymentModalOpen(true);
              }}
            >
              <CreditCard size={14} />
              결제하기
            </Button>
          )}
        </div>
      </Link>

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
