'use client';

import  { type ReactNode } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '@/lib/cn';

interface BaseVirtualizedListProps<T> {
  /** 렌더링할 데이터 리스트 */
  data: T[];
  /** 각 아이템 렌더 함수 */
  renderItem: (item: T, index: number) => ReactNode;
  /** className */
  className?: string;
  /** 로딩 상태 */
  loading?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 빈 리스트 메시지 */
  emptyText?: string;
  /** 로딩 메시지 */
  loadingText?: string;
  /** 더 불러오기 메시지 */
  loadingMoreText?: string;
  /** 높이 */
  height?: number | string;
  /** 아이템 간격 */
  itemGap?: number;
}

export interface ChatVirtualHandle {
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void;
  scrollToIndex: (index: number, behavior?: 'auto' | 'smooth') => void;
}

interface FeedListProps<T> extends BaseVirtualizedListProps<T> {
  loadMore?: () => void;
  hasMore?: boolean;
}

type VirtualizedListProps<T> = FeedListProps<T>;

// 메인 VirtualizedList 컴포넌트
export default function VirtualizedList<T>(props: VirtualizedListProps<T>) {
  const {
    data,
    renderItem,
    className = '',
    loading = false,
    error,
    emptyText = '데이터가 없습니다.',
    loadingText = '로딩 중...',
    loadingMoreText = '데이터를 더 불러오는 중...',
    height = '100%',
    itemGap = 16,
  } = props;

  /** 공통 에러 처리 */
  if (error) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-status-urgent font-medium">
        {error}
      </div>
    );
  }

  /** 공통 빈 데이터 처리 */
  if (!data || data.length === 0) {
    if (loading) {
      return (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted font-medium">
          {loadingText}
        </div>
      );
    }
    return (
      <div className="flex h-48 items-center justify-center text-sm text-text-muted font-medium">
        {emptyText}
      </div>
    );
  }

  const loadMore = props.loadMore;
  const hasMore = props.hasMore ?? false;

  return (
    <div className={cn(className)}>
      <Virtuoso
        useWindowScroll
        data={data}
        style={{ height }}
        endReached={() => {
          if (hasMore && loadMore && !loading) {
            loadMore();
          }
        }}
        itemContent={(index, item) => (
          <div style={{ paddingBottom: itemGap }}>
            {renderItem(item, index)}
          </div>
        )}
        components={{
          Footer: () =>
            loading ? (
              <div className="flex justify-center py-10">
                <div className="flex items-center gap-3 rounded-full border border-border-main bg-bg-sub px-5 py-2 shadow-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                  <span className="text-xs font-bold text-text-sub">{loadingMoreText}</span>
                </div>
              </div>
            ) : hasMore ? (
              <div className="flex justify-center py-8">
                <div className="text-[11px] font-medium text-text-muted">
                  스크롤하여 더 보기
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="text-[11px] font-medium text-text-muted">
                  마지막 항목입니다
                </div>
              </div>
            ),
        }}
      />
    </div>
  );
}
