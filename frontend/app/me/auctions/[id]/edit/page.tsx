'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMe } from '@/hooks/query/useMe';
import { useAuctionDetail } from '@/hooks/query/useAuctionDetail';
import { useUpdateAuction } from '@/hooks/query/useUpdateAuction';
import AuctionForm from '@/components/auction/AuctionForm';
import AuctionEditPageSkeleton from '@/components/skeleton/AuctionEditPageSkeleton';
import AuctionNotFound from '@/components/me/AuctionNotFound';
import LoginRequiredPrompt from '@/components/me/LoginRequiredPrompt';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { toFormInitialData } from '@/lib/auction/auctionToFormData';
import type { UpdateAuctionDto } from '@/types/auction';

export default function EditAuctionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { data: profile, isLoading: isMeLoading } = useMe();
  const { data: detail, isLoading: isAuctionLoading } = useAuctionDetail(id ?? '', {
    enabled: !!id,
  });
  const updateMutation = useUpdateAuction();
  const showToast = useToastStore((s) => s.showToast);

  const handleSubmit = async (dto: UpdateAuctionDto, imageFile?: File | null) => {
    if (!id) return;
    let uploadedUrl: string | undefined;
    try {
      let payload = { ...dto };
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile);
        uploadedUrl = url;
        payload = { ...payload, imageUrl: url };
      }
      await updateMutation.mutateAsync({ id, dto: payload });
      showToast('경매가 수정되었습니다.');
      router.push('/me/auctions');
    } catch (err) {
      if (uploadedUrl) {
        try {
          await api.deleteImage(uploadedUrl);
        } catch {
          // orphan 정리 실패는 로그만 (사용자에게는 수정 실패만 표시)
        }
      }
      const msg = err instanceof Error ? err.message : '경매 수정에 실패했습니다.';
      showToast(msg, 'error');
    }
  };

  if (isMeLoading) return null;
  if (profile === null) return <LoginRequiredPrompt />;
  if (!profile) return null;
  if (!id) return null;

  if (isAuctionLoading) {
    return <AuctionEditPageSkeleton />;
  }

  const formData = toFormInitialData(detail?.auction);
  if (!formData) {
    return <AuctionNotFound />;
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
        initialData={formData}
        auctionId={id}
        onSubmit={handleSubmit}
        submitLabel="수정 완료"
        isSubmitting={updateMutation.isPending}
      />
    </main>
  );
}
