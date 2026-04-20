'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/util/cn';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  LogIn,
  Gavel,
  ScrollText,
  Trophy,
  UserCircle,
} from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMe } from '@/hooks/query/useMe';
import { useLogout } from '@/hooks/query/useLogout';

export default function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: user, isLoading } = useMe({
    enabled: pathname !== '/login',
  });
  const logout = useLogout();

  const navItems: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[] = [
    { label: '경매', href: '/auction', icon: Gavel },
    { label: '거래내역', href: '/history', icon: ScrollText },
    { label: '랭킹', href: '/ranking', icon: Trophy },
  ];

  const profileNavItem = [
    { label: '내 프로필', href: '/me' },
    { label: '내 경매', href: '/me/auctions' },
    { label: '내 입찰', href: '/me/bids' },
    { label: '찜 목록', href: '/me/wishlist' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };
  useClickOutside(profileRef, () => setProfileOpen(false), 'mousedown');

  useEffect(() => {
    const id = window.setTimeout(() => setMobileNavOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <nav
      className="sticky top-0 z-[100] w-full bg-bg-main/95 dark:bg-bg-main/90 backdrop-blur-md border-b border-border-main"
      aria-label="메인 네비게이션"
    >
      <div className="max-w-7xl mx-auto px-5 h-14 md:h-16 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-8">
          <button
            type="button"
            className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-main bg-bg-sub/50 hover:bg-bg-sub transition-colors z-10"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <X size={20} className="text-text-main" />
            ) : (
              <Menu size={20} className="text-text-main" />
            )}
          </button>
          <Link href="/" className="group shrink-0 min-w-0" aria-label="LaceUp 홈으로 이동">
            <h1 className="text-lg md:text-xl font-black tracking-tighter text-text-main group-hover:opacity-80 transition-opacity">
              Lace<span className="text-brand-primary">Up</span>
            </h1>
          </Link>
          <div className="hidden min-w-0 lg:flex lg:flex-1 lg:justify-center xl:justify-start gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive(item.href)
                    ? 'text-text-main bg-bg-sub'
                    : 'text-text-sub hover:text-text-main hover:bg-bg-sub/70',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user && !isLoading ? (
            <>
              <NotificationBell />
              <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-2 h-9 md:h-10 pl-3 pr-2.5 rounded-xl border border-border-main bg-bg-sub/50 hover:bg-bg-sub transition-colors',
                  profileOpen && 'bg-bg-sub ring-1 ring-border-main',
                )}
                aria-label="프로필 메뉴"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <User size={18} className="text-text-sub shrink-0" />
                <span className="text-sm font-semibold text-text-main max-w-25 truncate hidden sm:block">
                  {user.nickname}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-text-muted shrink-0 transition-transform',
                    profileOpen && 'rotate-180',
                  )}
                />
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 py-1 min-w-40 bg-bg-main dark:bg-bg-card border border-border-main rounded-xl shadow-lg z-50"
                  aria-label="프로필 메뉴"
                >
                  {profileNavItem.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main hover:bg-bg-sub transition-colors"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-bg-sub transition-colors"
                      role="menuitem"
                    >
                      <Shield size={16} className="shrink-0" />
                      관리자
                    </Link>
                  )}
                  <div className="my-1 border-t border-border-main" role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      setProfileOpen(false);
                      await logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-sub hover:bg-bg-sub hover:text-status-urgent transition-colors"
                  >
                    <LogOut size={16} className="shrink-0" />
                    로그아웃
                  </button>
                </div>
              )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden lg:inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-xl bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5 dark:shadow-none transition-all"
              aria-label="로그인"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[110] bg-black/50 lg:hidden"
            aria-label="메뉴 배경 닫기"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            className="fixed left-0 bottom-0 z-[120] flex w-[min(100%,20rem)] flex-col border-r border-border-main bg-bg-main shadow-2xl lg:hidden top-14 md:top-16 rounded-r-2xl"
            role="dialog"
            aria-label="모바일 메뉴"
          >
            <div className="shrink-0 border-b border-border-main bg-bg-sub/40 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                LaceUp
              </p>
              {user ? (
                <p className="mt-1 truncate text-sm font-bold text-text-main">
                  {user.nickname}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-text-sub">
                  로그인하고 경매에 참여해 보세요
                </p>
              )}
            </div>

            <nav
              className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
              aria-label="모바일 주요 링크"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors',
                      isActive(item.href)
                        ? 'bg-brand-primary/10 text-text-main ring-1 ring-brand-primary/20'
                        : 'text-text-sub hover:bg-bg-sub hover:text-text-main',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        isActive(item.href)
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'bg-bg-sub text-text-muted',
                      )}
                    >
                      <Icon size={18} strokeWidth={2.25} aria-hidden />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-border-main bg-bg-sub/30 p-4">
              {user ? (
                <Link
                  href="/me"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border-main bg-bg-main px-4 py-3 text-sm font-bold text-text-main shadow-sm transition-colors hover:bg-bg-sub"
                >
                  <UserCircle size={18} className="text-text-sub" aria-hidden />
                  마이페이지
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-text-main px-4 py-3.5 text-sm font-black text-bg-main shadow-lg transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  <LogIn size={18} aria-hidden />
                  로그인
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}





