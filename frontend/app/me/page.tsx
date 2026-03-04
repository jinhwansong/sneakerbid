'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/query/useMe';
import { Button } from '@/components/common/Button';
import { formatPrice, formatJoinDate } from '@/lib/util/format';
import { cn } from '@/lib/util/cn';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';

const STATS_ITEMS = [
  { key: 'bidCount' as const, label: '입찰 횟수' },
  { key: 'wonCount' as const, label: '낙찰 횟수' },
  { key: 'soldCount' as const, label: '판매 완료' },
] as const;

const QUICK_LINKS = [
  { href: '/me/auctions', label: '내 경매', description: '등록한 경매 목록 보기' },
  { href: '/me/bids', label: '내 입찰', description: '입찰중·낙찰·유찰 내역' },
  { href: '/me/wishlist', label: '찜 목록', description: '관심 경매 모아보기' },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading: isMeLoading } = useMe();
  if (isMeLoading) return null;
  if (!profile) return <LoginRequiredPrompt />;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        {/* 헤더 */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            내 프로필
          </h1>
          <p className="mt-1 text-text-sub font-medium">
            계정 정보와 활동 현황을 확인하세요.
          </p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-bg-main border border-border-main rounded-2xl md:rounded-3xl overflow-hidden">
          {/* 상단: 프로필 이미지 + 기본 정보 */}
          <div className="p-6 md:p-10 flex flex-col sm:flex-row items-center gap-6 md:gap-10">
            {/* 아바타 */}
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-bg-sub border-2 border-border-main">
                {profile.profileImageUrl ? (
                  <Image
                    src={profile.profileImageUrl}
                    alt={profile.nickname}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-sub text-2xl font-black text-text-muted">
                    {profile.nickname.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* 닉네임 + 기본 정보 */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl md:text-2xl font-black text-text-main">
                {profile.nickname}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {profile.role === 'USER' ? '일반 회원' : profile.role}
              </p>
              <div className="mt-3 text-sm text-text-sub">
                가입일 {formatJoinDate(profile.createdAt)}
              </div>
            </div>
          </div>

          {/* 잔액 섹션 */}
          <div className="px-6 md:px-10 py-5 bg-bg-sub/50 border-t border-border-main">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">보유 잔액</p>
                <p className="text-xl md:text-2xl font-black text-text-main tabular-nums">
                  {formatPrice(profile.balance)}원
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/me/charge')}
                aria-label="충전하기"
              >
                충전하기
              </Button>
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="grid grid-cols-3 divide-x divide-border-main border-t border-border-main">
            {STATS_ITEMS.map(({ key, label }) => (
              <div key={key} className="p-5 text-center">
                <p className="text-2xl font-black text-text-main tabular-nums">
                  {profile.stats?.[key] ?? 0}
                </p>
                <p className="text-xs font-medium text-text-muted mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, label, description }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'block p-4 rounded-xl border border-border-main bg-bg-main',
                'hover:bg-bg-card hover:border-brand-primary transition-colors',
              )}
            >
              <p className="font-bold text-text-main">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}










