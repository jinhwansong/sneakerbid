import React from 'react';
import { cn } from '@/lib/cn';

/**
 * 로딩 플레이스홀더. 기본적으로 decorative(aria-hidden)로 렌더되어
 * 스크린 리더에 반복 알림을 유발하지 않음.
 * 호출부(HistorySkeleton, MainSkeleton 등)에서 단일 컨테이너에
 * role="status" 및 sr-only 로딩 문구를 두어 한 번만 알림되도록 함.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 기본: 직사각형. circle: 원형 */
  variant?: 'rect' | 'circle';
  /** decorative일 때 true (기본). false면 aria-hidden 미적용 */
  ariaHidden?: boolean;
}

export function Skeleton({
  className,
  variant = 'rect',
  ariaHidden = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden={ariaHidden ? 'true' : undefined}
      className={cn(
        'bg-bg-sub animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded',
        className,
      )}
      {...props}
    />
  );
}
