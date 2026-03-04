import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { OrderItem } from '@/types/orders';

export default function WonCard({ item }: { item: OrderItem }) {
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
          <span
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg',
              'bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5',
              'cursor-pointer font-bold transition-all',
            )}
          >
            <CreditCard size={14} />
            결제하기
          </span>
        )}
      </div>
    </Link>
  );
}







