'use client';

import { useIsFetching } from '@tanstack/react-query';

export default function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();

  if (isFetching === 0) return null;

  return (
    <div
      className="fixed left-0 top-0 z-100 h-0.5 w-full overflow-hidden bg-transparent"
      aria-hidden
    >
      <div className="global-loading-bar h-full w-1/3 rounded-full bg-brand-primary" />
    </div>
  );
}
