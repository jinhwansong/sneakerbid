'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/cn';

export const Header = () => {
  const pathname = usePathname();

  const navItems = [
    { label: '경매', href: '/auction' },
    { label: '거래내역', href: '/history' },
    { label: '랭킹', href: '/ranking' },
    { label: '이벤트', href: '/events' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-bg-main/80 backdrop-blur-md border-b border-border-main">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="group">
            <h1 className="text-xl font-black tracking-tighter text-text-main group-hover:opacity-80 transition-opacity">
              SNEAKER<span className="text-brand-primary">BID</span>
            </h1>
          </Link>
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-text-main",
                  pathname === item.href ? "text-text-main underline underline-offset-8 decoration-2" : "text-text-sub"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* 통합된 게스트 상태 표시기 */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-bg-sub rounded-2xl border border-border-main/50 mr-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-active"></span>
              </span>
              <span className="text-[11px] font-bold text-text-main">
                게스트 모드
              </span>
            </div>
            <div className="h-3 w-px bg-border-main" />
            <span className="text-[10px] text-text-muted font-medium">
              시뮬레이션 엔진 가동 중
            </span>
          </div>

          

          <Button
            variant="ghost"
            size="md"
            className="text-text-sub font-semibold hover:text-text-main hover:bg-bg-sub"
          >
            로그인
          </Button>
        </div>
      </div>
    </nav>
  );
};
