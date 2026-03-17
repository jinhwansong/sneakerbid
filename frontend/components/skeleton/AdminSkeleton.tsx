import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';

interface AdminQueryStateProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  /** 로딩 시 표시할 UI. 미지정 시 기본 스피너 */
  renderLoading?: () => React.ReactNode;
  children: React.ReactNode;
}

/** 로딩/에러 시 스켈레톤·에러 UI, 성공 시 children */
export function AdminQueryState({
  isLoading,
  isError,
  errorMessage = '데이터를 불러오는데 실패했습니다.',
  renderLoading,
  children,
}: AdminQueryStateProps) {
  if (isLoading)
    return (
      <>{renderLoading ? renderLoading() : <AdminLoadingSkeleton />}</>
    );
  if (isError) return <AdminErrorState message={errorMessage} />;
  return <>{children}</>;
}

export function AdminLoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">로딩 중입니다.</span>
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    </div>
  );
}

export function AdminErrorState({ message }: { message: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-status-urgent font-medium">{message}</p>
    </div>
  );
}

/** 정산 현황 페이지 스켈레톤 */
export function AdminSettlementSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">정산 현황을 불러오는 중입니다.</span>
      <div className="mb-8">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main"
          >
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-10">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-bg-sub/50 dark:bg-bg-sub/30 border border-border-subtle"
            >
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-2xl mb-8" />
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** 봇 관리 페이지 스켈레톤 */
export function AdminBotsSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">봇 목록을 불러오는 중입니다.</span>
      <div className="mb-8">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="mt-2 h-5 w-56" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 차트 페이지 로딩 스켈레톤 */
export function AdminChartSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">입찰 히스토리를 불러오는 중입니다.</span>
      <div className="h-[400px] w-full rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main p-4 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    </div>
  );
}
