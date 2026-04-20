'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/util/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotificationCount,
} from '@/hooks/query/useNotifications';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import type { NotificationItem } from '@/types/notifications';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function notificationHref(n: NotificationItem): string | null {
  const aid =
    n.metadata && typeof n.metadata === 'object' && 'auctionId' in n.metadata
      ? String((n.metadata as { auctionId?: string }).auctionId ?? '')
      : '';
  if (aid) return `/auction/${aid}`;
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useClickOutside(panelRef, () => setOpen(false), 'mousedown');

  useNotificationStream(true);

  const { data: unread = 0 } = useUnreadNotificationCount(true);
  const { data: listData, isLoading } = useNotificationsList(open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = listData?.items ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-border-main bg-bg-sub/50 hover:bg-bg-sub transition-colors',
          open && 'bg-bg-sub ring-1 ring-border-main',
        )}
        aria-label="알림"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={20} className="text-text-main" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-status-urgent text-[10px] font-bold text-white leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="알림 목록"
          className="fixed inset-x-3 top-16 z-50 max-h-[min(70vh,420px)] overflow-hidden rounded-xl border border-border-main bg-bg-main shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-1.5 md:w-96 md:max-h-[min(70vh,420px)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border-main px-3 py-2.5">
            <span className="text-sm font-bold text-text-main">알림</span>
            {unread > 0 && (
              <button
                type="button"
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
                className="text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-[min(60vh,360px)] overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-8 text-center text-sm text-text-muted">
                불러오는 중…
              </p>
            )}
            {!isLoading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-text-muted">
                알림이 없습니다.
              </p>
            )}
            {!isLoading &&
              items.map((n) => {
                const href = notificationHref(n);
                const unreadRow = !n.readAt;
                const inner = (
                  <>
                    <p
                      className={cn(
                        'text-sm font-semibold text-text-main',
                        unreadRow && 'font-bold',
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-text-sub line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-text-muted">
                      {formatWhen(n.createdAt)}
                    </p>
                  </>
                );
                return (
                  <div
                    key={n.id}
                    className="border-b border-border-main last:border-b-0"
                  >
                    {href ? (
                      <Link
                        href={href}
                        className="block px-4 py-3 hover:bg-bg-sub transition-colors text-left w-full"
                        onClick={() => {
                          if (unreadRow) markRead.mutate(n.id);
                          setOpen(false);
                        }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full px-4 py-3 text-left hover:bg-bg-sub transition-colors"
                        onClick={() => {
                          if (unreadRow) markRead.mutate(n.id);
                        }}
                      >
                        {inner}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
