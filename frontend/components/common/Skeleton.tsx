import React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 기본: 직사각형. circle: 원형 */
  variant?: 'rect' | 'circle';
}

export function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
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
