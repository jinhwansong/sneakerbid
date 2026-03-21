'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/query/useMe';
import { cn } from '@/lib/util/cn';
import {
  LayoutDashboard,
  Bot,
  Gavel,
  BarChart3,
  Heart,
  Package,
  HandCoins,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: '정산 현황', icon: LayoutDashboard },
  { href: '/admin/bots', label: '봇 관리', icon: Bot },
  { href: '/admin/auctions', label: '경매 관리', icon: Gavel },
  { href: '/admin/chart', label: '가격 차트', icon: BarChart3 },
  { href: '/me/wishlist', label: '찜 목록', icon: Heart },
  { href: '/me/auctions', label: '내 경매', icon: Package },
  { href: '/me/bids', label: '내 입찰', icon: HandCoins },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 */}
          <aside className="lg:w-56 shrink-0">
            <nav
              className="sticky top-24 flex lg:flex-col gap-1 p-2 rounded-2xl bg-bg-sub border border-border-main"
              aria-label="관리자 메뉴"
            >
              {ADMIN_NAV.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-bg-main text-text-main shadow-sm'
                        : 'text-text-sub hover:text-text-main hover:bg-bg-main/50',
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* 메인 */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
