'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/util/cn';
import {
  ChevronDown,
  User,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useMe } from '@/hooks/query/useMe';
import { useLogout } from '@/hooks/query/useLogout';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Button } from '@/components/common/Button';

export default function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: user, isLoading } = useMe({
    enabled: pathname !== '/login',
  });
  const logout = useLogout();

  const navItems: { label: string; href: string }[] = [
    { label: '경매', href: '/auction' },
    { label: '거래내역', href: '/history' },
    { label: '랭킹', href: '/ranking' },
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
  useBodyScrollLock(mobileNavOpen);

  useEffect(() => {
    startTransition(() => {
      setPortalReady(true);
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileNavOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const closeMobile = () => setMobileNavOpen(false);

  const mobileDrawer =
    portalReady && mobileNavOpen
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-200 bg-black/55 backdrop-blur-[2px] xl:hidden"
              aria-label="메뉴 배경 닫기"
              onClick={closeMobile}
            />
            <aside
              className="fixed right-0 top-0 z-220 flex h-dvh w-[min(100%,20rem)] flex-col border-l border-border-main bg-bg-main shadow-[-8px_0_32px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)] xl:hidden rounded-l-2xl"
              role="dialog"
              aria-label="모바일 메뉴"
              aria-modal="true"
            >
              <div className="shrink-0 rounded-tl-2xl bg-brand-primary px-4 py-4 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                  LaceUp
                </p>
                {user ? (
                  <p className="mt-0.5 truncate text-sm font-bold text-white">
                    {user.nickname}
                  </p>
                ) : (
                  <>
                    <p className="mt-0.5 text-xs font-medium text-white/90">
                      로그인하고 경매에 참여해 보세요
                    </p>
                    {isLoading ? (
                      <p className="mt-3 text-xs font-medium text-white/75">
                        로그인 상태 확인 중…
                      </p>
                    ) : (
                      <Link
                        href="/login"
                        onClick={closeMobile}
                        className="mt-3 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-brand-primary shadow-md transition-all hover:brightness-95 active:scale-[0.99]"
                      >
                        로그인
                      </Link>
                    )}
                  </>
                )}
              </div>

              <nav
                className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
                aria-label="주요 메뉴"
              >
                <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  탐색
                </p>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'rounded-xl px-3 py-3 text-sm font-bold transition-colors',
                      isActive(item.href)
                        ? 'bg-brand-primary/10 text-text-main ring-1 ring-brand-primary/20'
                        : 'text-text-sub hover:bg-bg-sub hover:text-text-main',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {user && (
                  <>
                    <div className="my-2 border-t border-border-main" />
                    <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      내 계정
                    </p>
                    {profileNavItem.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className={cn(
                          'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          isActive(item.href)
                            ? 'bg-bg-sub text-text-main'
                            : 'text-text-sub hover:bg-bg-sub hover:text-text-main',
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={closeMobile}
                        className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-primary hover:bg-bg-sub"
                      >
                        관리자페이지
                      </Link>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      fullWidth
                      onClick={async () => {
                        closeMobile();
                        await logout();
                      }}
                      className="mt-1 border-border-main bg-bg-main px-3 py-3 text-status-urgent hover:bg-bg-sub"
                    >
                      로그아웃
                    </Button>
                  </>
                )}
              </nav>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <nav
      className={cn(
        'sticky top-0 w-full border-b border-border-main bg-bg-main/95 backdrop-blur-md dark:bg-bg-main/90',
        mobileNavOpen ? 'z-210' : 'z-100',
      )}
      aria-label="메인 네비게이션"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-5 md:h-16">
        <Link
          href="/"
          className="group min-w-0 shrink-0"
          aria-label="LaceUp 홈으로 이동"
        >
          <h1 className="text-lg font-black tracking-tighter text-text-main md:text-xl group-hover:opacity-80 transition-opacity">
            Lace<span className="text-brand-primary">Up</span>
          </h1>
        </Link>

        <div className="hidden min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-hide xl:flex xl:justify-center 2xl:justify-start">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                isActive(item.href)
                  ? 'bg-bg-sub text-text-main'
                  : 'text-text-sub hover:bg-bg-sub/70 hover:text-text-main',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user && !isLoading ? (
            <>
              <NotificationBell />
              
              <div className="relative hidden xl:block" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-xl border border-border-main bg-bg-sub/50 pl-3 pr-2.5 transition-colors md:h-10',
                    profileOpen && 'bg-bg-sub ring-1 ring-border-main',
                  )}
                  aria-label="프로필 메뉴"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <User size={18} className="shrink-0 text-text-sub" />
                  <span className="hidden max-w-25 truncate text-sm font-semibold text-text-main sm:block">
                    {user.nickname}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-text-muted transition-transform',
                      profileOpen && 'rotate-180',
                    )}
                  />
                </button>
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1.5 min-w-40 rounded-xl border border-border-main bg-bg-main py-1 shadow-lg dark:bg-bg-card"
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      fullWidth
                      role="menuitem"
                      whileTap={{ scale: 1 }}
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                      }}
                      className="h-auto justify-start gap-2 rounded-none px-4 py-2.5 font-medium hover:text-status-urgent"
                    >
                      <LogOut size={16} className="shrink-0" />
                      로그아웃
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            !isLoading && (
              <Link
                href="/login"
                className="hidden items-center justify-center rounded-xl bg-text-main px-3 py-1.5 text-xs font-bold text-bg-main shadow-lg transition-all hover:brightness-110 md:px-4 md:py-2 md:text-sm xl:inline-flex"
                aria-label="로그인"
              >
                로그인
              </Link>
            )
          )}

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-main bg-bg-sub/50 transition-colors hover:bg-bg-sub xl:hidden"
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
        </div>
      </div>

      {mobileDrawer}
    </nav>
  );
}


