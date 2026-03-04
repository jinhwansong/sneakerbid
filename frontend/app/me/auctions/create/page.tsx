'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/query/useMe';
import AuctionForm from '@/components/auction/AuctionForm';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import type { CreateAuctionDto } from '@/types/auction';

export default function AuctionCreatePage() {
  const router = useRouter();
  const { data: profile, isLoading: isMeLoading } = useMe();
  const showToast = useToastStore((s) => s.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    dto: CreateAuctionDto | import('@/types/auction').UpdateAuctionDto,
    imageFile: File | null,
  ) => {
    if (!imageFile) {
      showToast('상품 이미지를 등록해주세요.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { url } = await api.uploadImage(imageFile);
      const payload = { ...dto, imageUrl: url } as CreateAuctionDto;
      await api.auctions.create(payload);
      showToast('경매가 등록되었습니다.');
      router.push('/me/auctions');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '경매 등록에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMeLoading) return null;
  if (profile === null) return <LoginRequiredPrompt />;
  if (!profile) return null;

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
        onSubmit={handleSubmit}
        submitLabel="경매 등록하기"
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
