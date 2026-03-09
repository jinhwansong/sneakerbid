'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useMe } from '@/hooks/query/useMe';
import { useMyAuctions } from '@/hooks/query/useMyAuctions';
import { useDeleteAuction } from '@/hooks/query/useDeleteAuction';
import { useToastStore } from '@/store/useToastStore';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import MyAuctionCard from '@/components/me/MyAuctionCard';
import EmptyMyAuctions from '@/components/me/EmptyMyAuctions';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/util/cn';
import { useState } from 'react';

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'ongoing', label: '진행중' },
  { id: 'closed', label: '종료됨' },
] as const;

export default function MyAuctionsPage() {
  const { data: profile, isLoading: isMeLoading } = useMe();
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]['id']>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteMutation = useDeleteAuction();
  const showToast = useToastStore((s) => s.showToast);

  const { data: items = [], isLoading, isError } = useMyAuctions({
    status: activeTab,
    enabled: !!profile,
  });

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      showToast('경매가 삭제되었습니다.');
      setDeleteTargetId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '삭제에 실패했습니다.';
      showToast(msg, 'error');
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
          <EmptyMyAuctions />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
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
        onClose={() => !deleteMutation.isPending && setDeleteTargetId(null)}
        title="경매 삭제"
        message="정말 이 경매를 삭제하시겠습니까? 삭제된 경매는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
