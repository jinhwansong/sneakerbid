'use client';

import { useState } from 'react';
import { useAdminForceClose } from '@/hooks/query/useAdminForceClose';
import { useAuctionList, auctionListPagesToItems } from '@/hooks/query/useAuctionList';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/util/format';
import { Gavel, Loader2 } from 'lucide-react';
import { AdminLoadingSkeleton, AdminErrorState } from '@/components/skeleton/AdminSkeleton';
import { useToastStore } from '@/store/useToastStore';
import Image from 'next/image';
import { BLUR_PLACEHOLDER } from '@/lib/constants/image';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function AdminAuctionsPage() {
  const [auctionIdInput, setAuctionIdInput] = useState('');
  const [forceCloseTargetId, setForceCloseTargetId] = useState<string | null>(null);
  const forceClose = useAdminForceClose();
  const { showToast } = useToastStore();
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuctionList({ sort: 'ending_soon' });
  const items = auctionListPagesToItems(data);
  const ongoingItems = items.filter((i) => i.status === 'ongoing');

  const handleRequestForceCloseById = () => {
    const id = auctionIdInput.trim();
    if (!id) {
      showToast('경매 ID를 입력하세요.', 'error');
      return;
    }
    setForceCloseTargetId(id);
  };

  const handleRequestForceClose = (id: string) => {
    setForceCloseTargetId(id);
  };

  const handleForceCloseConfirm = async () => {
    if (!forceCloseTargetId) return;
    try {
      await forceClose.mutateAsync(forceCloseTargetId);
      showToast('경매가 강제 종료되었습니다.');
      setForceCloseTargetId(null);
      if (auctionIdInput.trim() === forceCloseTargetId) {
        setAuctionIdInput('');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '강제 종료 실패', 'error');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
          경매 관리
        </h1>
        <p className="mt-1 text-text-sub font-medium">
          진행 중인 경매를 강제 종료할 수 있습니다.
        </p>
      </div>

      {/* ID로 강제 종료 */}
      <div className="mb-10 p-5 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main">
        <h2 className="text-sm font-bold text-text-sub mb-3 block">
          경매 ID로 강제 종료
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="경매 ID 입력"
            value={auctionIdInput}
            onChange={(e) => setAuctionIdInput(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl bg-bg-input border border-border-main text-text-main placeholder:text-text-muted text-sm"
          />
          <Button
            variant="outline"
            size="md"
            disabled={forceClose.isPending}
            onClick={handleRequestForceCloseById}
          >
            {forceClose.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Gavel size={16} className="mr-1.5" />
                강제 종료
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 진행 중 경매 목록 */}
      <div>
        <h2 className="text-sm font-bold text-text-sub mb-4 block">
          진행 중 경매 (마감 임박순)
        </h2>
        {isLoading ? (
          <AdminLoadingSkeleton />
        ) : isError ? (
          <AdminErrorState
            message={error instanceof Error ? error.message : '경매 목록을 불러오는데 실패했습니다.'}
          />
        ) : ongoingItems.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            진행 중인 경매가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {ongoingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-bg-sub shrink-0">
                      <Image
                        src={item.imageUrl || BLUR_PLACEHOLDER}
                        alt={item.modelName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-main truncate">
                        {item.brand} {item.modelName}
                      </p>
                      <p className="text-sm text-text-muted">
                        {formatPrice(item.currentBid)}원 · {item.participants}명
                      </p>
                      <p className="text-xs text-text-muted font-mono mt-0.5">
                        {item.id}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={forceClose.isPending}
                    onClick={() => handleRequestForceClose(item.id)}
                  >
                    <Gavel size={14} className="mr-1" />
                    강제 종료
                  </Button>
                </div>
              ))}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!forceCloseTargetId}
        onClose={() => !forceClose.isPending && setForceCloseTargetId(null)}
        title="경매 강제 종료"
        message={`경매 ${forceCloseTargetId ?? ''}를 강제 종료하시겠습니까?`}
        confirmLabel="강제 종료"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleForceCloseConfirm}
        isLoading={forceClose.isPending}
      />
    </div>
  );
}
