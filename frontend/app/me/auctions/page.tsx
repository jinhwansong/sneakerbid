'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Plus, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useMe } from '@/hooks/query/useMe';
import { useMyAuctions } from '@/hooks/query/useMyAuctions';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/store/useToastStore';
import { api } from '@/lib/api';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import Badge from '@/components/common/Badge';
import { useRemainingTime } from '@/hooks/useRemainingTime';
import { useState } from 'react';
import type { AuctionItem } from '@/types/auction';
import { formatPrice } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Skeleton } from '@/components/common/Skeleton';

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'ongoing', label: '진행중' },
  { id: 'closed', label: '종료됨' },
] as const;

/** 판매자용 경매 카드 - 입찰 버튼 대신 상세/수정/삭제 액션 */
function MyAuctionCard({
  item,
  onDeleteClick,
  onEditClick,
}: {
  item: AuctionItem;
  onDeleteClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
}) {
  const router = useRouter();
  const remainingTime = useRemainingTime(item.endTime);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleEdit = () => {
    setMenuOpen(false);
    (onEditClick ?? ((id: string) => router.push(`/me/auctions/${id}/edit`)))(
      item.id,
    );
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-bg-main border border-border-main hover:shadow-xl hover:shadow-black/5 transition-all">
      <Link href={`/auction/${item.id}`} className="flex flex-col flex-1">
        <div className="absolute top-4 left-4 z-10">
          <Badge status={item.status} />
        </div>

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
          <span className="text-[11px] font-medium tabular-nums" suppressHydrationWarning>
            {item.status === 'closed' || item.status === 'failed' || item.status === 'buy_now'
              ? '종료'
              : `${remainingTime} 남음`}
          </span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-lg hover:bg-bg-sub text-text-muted hover:text-text-main transition-colors"
              aria-label="더보기"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 py-1.5 bg-bg-main border border-border-main rounded-xl shadow-lg z-20 min-w-[120px]">
                  <Link
                    href={`/auction/${item.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-main hover:bg-bg-sub"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink size={14} />
                    상세보기
                  </Link>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-text-main hover:bg-bg-sub"
                  >
                    <Pencil size={14} />
                    수정
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-status-urgent hover:bg-status-urgent/10"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteClick?.(item.id);
                    }}
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 빈 상태 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-sub flex items-center justify-center mb-6">
        <Package size={36} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">등록한 경매가 없습니다</h3>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        스니커즈를 등록하고 경매를 시작해보세요.
      </p>
      <Link
        href="/me/auctions/create"
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold transition-all',
          'bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5',
          'px-6 py-3.5 text-base rounded-2xl'
        )}
      >
        <Plus size={20} />
        경매 등록
      </Link>
    </div>
  );
}

export default function MyAuctionsPage() {
  const { data: profile, isLoading: isMeLoading } = useMe();
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]['id']>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  const { data: items = [], isLoading, isError } = useMyAuctions({
    status: activeTab,
    enabled: !!profile,
  });

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.auctions.delete(deleteTargetId);
      showToast('경매가 삭제되었습니다.');
      setDeleteTargetId(null);
      await queryClient.invalidateQueries({
        queryKey: ['auctions', 'mySelling'],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '삭제에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isMeLoading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bg-main">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
          <div role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">내 경매를 불러오는 중입니다.</span>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-12">
              <div>
                <Skeleton className="h-9 w-48 rounded-lg" />
                <Skeleton className="mt-2 h-5 w-64" />
              </div>
              <Skeleton className="h-11 w-36 rounded-xl shrink-0" />
            </div>
            <div className="flex bg-bg-sub p-1.5 rounded-2xl mb-10">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="flex-1 h-12 rounded-xl mx-1" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-4/3 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (profile === null) return <LoginRequiredPrompt />;
  if (!profile) return null;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
              내 경매
            </h1>
            <p className="mt-1 text-text-sub font-medium">
              등록한 경매 목록을 확인하고 관리하세요.
            </p>
          </div>
          <Link
            href="/me/auctions/create"
            className={cn(
              'inline-flex items-center justify-center gap-2 font-bold transition-all shrink-0',
              'bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5',
              'px-4 py-2.5 text-sm rounded-xl'
            )}
          >
            <Plus size={18} />
            경매 등록
          </Link>
        </div>

        {/* 탭 */}
        <div className="flex bg-bg-sub p-1.5 rounded-2xl mb-10">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-sm font-bold rounded-xl transition-all',
                activeTab === tab.id
                  ? 'bg-bg-main text-text-main shadow-sm shadow-black/5'
                  : 'text-text-muted hover:text-text-sub',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 리스트 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-4/3 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-text-muted">목록을 불러오는 중 오류가 발생했습니다.</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {items.map((item) => (
              <MyAuctionCard
                key={item.id}
                item={item}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => !isDeleting && setDeleteTargetId(null)}
        title="경매 삭제"
        message="정말 이 경매를 삭제하시겠습니까? 삭제된 경매는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </main>
  );
}
