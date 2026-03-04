'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useMe } from '@/hooks/query/useMe';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';

export default function NewAuctionPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useMe();
  if (isLoading) return null;
  if (!profile) return <LoginRequiredPrompt />;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-2xl mx-auto px-5 py-8 md:py-12">
        <Link
          href="/me/auctions"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main mb-8"
        >
          <ArrowLeft size={16} />
          내 경매로 돌아가기
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight mb-2">
          경매 등록
        </h1>
        <p className="text-text-sub font-medium mb-12">
          스니커즈 등록 폼입니다. (준비 중)
        </p>
        <div className="bg-bg-sub/50 border border-border-main rounded-2xl p-12 text-center">
          <p className="text-text-muted font-medium">등록 폼 UI 구현 예정</p>
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push('/me/auctions')}
            className="mt-6"
          >
            목록으로
          </Button>
        </div>
      </div>
    </main>
  );
}
