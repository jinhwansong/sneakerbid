'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function Header() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = false;

  const navItems = [
    { label: '경매', href: '/auction' },
    { label: '거래내역', href: '/history' },
    { label: '랭킹', href: '/ranking' },
    { label: '이벤트', href: '/events' },
  ];

  const profileNavItem = [
    { label: '상품 등록', href: '/auctions/new' },
    { label: '내 프로필', href: '/me' },
    { label: '내 경매', href: '/me/auctions' },
    { label: '찜 목록', href: '/me/wishlist' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };
  useClickOutside(profileRef, () => setProfileOpen(false), 'mousedown');

  return (
    <nav className="sticky top-0 z-50 w-full bg-bg-main/95 dark:bg-bg-main/90 backdrop-blur-md border-b border-border-main">
      <div className="max-w-7xl mx-auto px-5 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="group shrink-0">
            <h1 className="text-lg md:text-xl font-black tracking-tighter text-text-main group-hover:opacity-80 transition-opacity">
              SNEAKER<span className="text-brand-primary">BID</span>
            </h1>
          </Link>
          <div className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
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

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-2 h-9 md:h-10 pl-3 pr-2.5 rounded-xl border border-border-main bg-bg-sub/50 hover:bg-bg-sub transition-colors',
                  profileOpen && 'bg-bg-sub ring-1 ring-border-main',
                )}
              >
                <User size={18} className="text-text-sub shrink-0" />
                <span className="text-sm font-semibold text-text-main max-w-25 truncate hidden sm:block">
                  프로필
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
                <div className="absolute right-0 top-full mt-1.5 py-1 min-w-40 bg-bg-main dark:bg-bg-card border border-border-main rounded-xl shadow-lg z-50">
                  {profileNavItem.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main hover:bg-bg-sub transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="my-1 border-t border-border-main" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-sub hover:bg-bg-sub hover:text-status-urgent transition-colors"
                  >
                    <LogOut size={16} className="shrink-0" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-xl bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5 dark:shadow-none transition-all"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

