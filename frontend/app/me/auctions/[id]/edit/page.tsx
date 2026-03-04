'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMe } from '@/hooks/query/useMe';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { cn } from '@/lib/util/cn';

export default function EditAuctionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
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
          경매 수정
        </h1>
        <p className="text-text-sub font-medium mb-12">
          경매 수정 폼입니다. (준비 중)
        </p>
        <div className="bg-bg-sub/50 border border-border-main rounded-2xl p-12 text-center">
          <p className="text-text-muted font-medium">
            수정 폼 UI 구현 예정 {id && `(경매 ID: ${id})`}
          </p>
          <Link
            href="/me/auctions"
            className={cn(
              'mt-6 inline-flex items-center justify-center font-bold transition-all',
              'bg-transparent border border-border-main text-text-main hover:bg-bg-sub',
              'px-4 py-2.5 text-sm rounded-xl'
            )}
          >
            목록으로
          </Link>
        </div>
      </div>
    </main>
  );
}
