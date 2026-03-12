'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { useState, useRef } from 'react';
import Badge from '@/components/common/Badge';
import { useRemainingTime } from '@/hooks/useRemainingTime';
import { useClickOutside } from '@/hooks/useClickOutside';
import { formatPrice } from '@/lib/util/format';
import type { AuctionItem } from '@/types/auction';

const TERMINAL_STATES = new Set<string>(['closed', 'failed', 'buy_now']);

interface MyAuctionCardProps {
  item: AuctionItem;
  onDeleteClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
}

/** 판매자용 경매 카드 - 입찰 버튼 대신 상세/수정/삭제 액션 */
export default function MyAuctionCard({
  item,
  onDeleteClick,
  onEditClick,
}: MyAuctionCardProps) {
  const router = useRouter();
  const remainingTime = useRemainingTime(item.endTime);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), 'mousedown');

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    (onEditClick ?? ((id: string) => router.push(`/me/auctions/${id}/edit`)))(
      item.id,
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onDeleteClick?.(item.id);
  };

  return (
    <div className="overflow-hidden group relative flex flex-col rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all">
      <div className="absolute top-4 left-4 z-10">
        <Badge status={item.status} />
      </div>
      {/* 수정/삭제 메뉴 - 이미지 위 오른쪽 */}
      <div ref={menuRef} className="absolute top-3 right-3 z-10" style={{ isolation: 'isolate' }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className=" px-2.5 py-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/90 hover:text-white hover:bg-black/60 transition-colors"
          aria-label="더보기"
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 py-1 min-w-[120px] bg-bg-main border border-border-main rounded-xl shadow-xl z-30">
            <button
              type="button"
              onClick={handleEdit}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main hover:bg-bg-sub transition-colors text-left rounded-t-xl"
            >
              <Pencil size={16} className="shrink-0" />
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-status-urgent hover:bg-bg-sub transition-colors text-left rounded-b-xl"
            >
              <Trash2 size={16} className="shrink-0" />
              삭제
            </button>
          </div>
        )}
      </div>

      <Link href={`/auction/${item.id}`} className="flex flex-col flex-1 relative z-0">
        <div className="aspect-4/3 relative overflow-hidden bg-bg-card">
          <Image
            src={item.imageUrl}
            alt={item.modelName}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-0.5">
              {item.brand}
            </p>
            <h3 className="text-sm font-medium text-text-main line-clamp-1 leading-snug">
              {item.modelName}
            </h3>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">현재 입찰가</p>
                <p className="text-xl font-black text-text-main tabular-nums tracking-tight">
                  {formatPrice(item.currentBid)}
                </p>
              </div>
              {item.buyNowPrice && (
                <div className="text-right">
                  <p className="text-[10px] text-text-muted mb-0.5">즉시 구매가</p>
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

        </div>
      </div>
    </div>
  );
}
