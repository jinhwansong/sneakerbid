'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useMe } from '@/hooks/query/useMe';
import { useQuery } from '@tanstack/react-query';
import AuctionForm from '@/components/auction/AuctionForm';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import type { UpdateAuctionDto } from '@/types/auction';

export default function AuctionEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: profile } = useMe();
  const showToast = useToastStore((s) => s.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: auction, isLoading, isError } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.auctions.get(id),
    enabled: !!id && !!profile,
  });

  const handleSubmit = async (dto: UpdateAuctionDto, imageFile: File | null) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      let payload = { ...dto };
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile);
        payload = { ...payload, imageUrl: url };
      }
      await api.auctions.update(id, payload);
      showToast('경매가 수정되었습니다.');
      router.push('/me/auctions');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '경매 수정에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return <LoginRequiredPrompt />;

  if (isLoading || !auction) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bg-main">
        <div className="max-w-6xl mx-auto px-5 py-16 text-center">
          <p className="text-text-muted">경매 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-bg-main">
        <div className="max-w-6xl mx-auto px-5 py-16 text-center">
          <p className="text-status-urgent mb-4">경매를 불러올 수 없습니다.</p>
          <Link href="/me/auctions" className="text-brand-primary hover:underline">
            내 경매로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-6xl mx-auto px-5 pt-8">
        <Link
          href="/me/auctions"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main mb-8"
        >
          <ArrowLeft size={16} />
          내 경매로 돌아가기
        </Link>
      </div>
      <AuctionForm
        initialData={auction}
        auctionId={id}
        onSubmit={handleSubmit}
        submitLabel="수정 완료"
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
