'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input, TextArea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import AuctionImageUpload from '@/components/auction/AuctionImageUpload';
import { BRANDS, SIZES } from '@/constants';
import type { CreateAuctionDto, UpdateAuctionDto, GetAuctionResponse } from '@/types/auction';

export interface AuctionFormValues {
  modelName: string;
  brand: string;
  color: string;
  description: string;
  size: string | number;
  startPrice: string;
  buyNowPrice: string;
  minimumIncrement: string;
  endTime: string;
}

const INITIAL_VALUES: AuctionFormValues = {
  modelName: '',
  brand: '',
  color: '',
  description: '',
  size: '',
  startPrice: '',
  buyNowPrice: '',
  minimumIncrement: '10000',
  endTime: '',
};

const INCREMENT_OPTIONS = [
  { label: '1,000원', value: '1000' },
  { label: '5,000원', value: '5000' },
  { label: '10,000원', value: '10000' },
  { label: '30,000원', value: '30000' },
  { label: '50,000원', value: '50000' },
];

function auctionToFormValues(a: GetAuctionResponse): AuctionFormValues {
  const endDate = a.endTime ? new Date(a.endTime) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const endTimeStr =
    `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

  return {
    modelName: a.modelName ?? '',
    brand: a.brand ?? '',
    color: a.colorway ?? '',
    description: a.description ?? '',
    size: a.size != null ? String(a.size) : '',
    startPrice: String(a.startPrice ?? ''),
    buyNowPrice: String(a.buyNowPrice ?? ''),
    minimumIncrement:
      a.minimumIncrement != null ? String(a.minimumIncrement) : '10000',
    endTime: endTimeStr,
  };
}

export interface AuctionFormProps {
  /** 생성 모드: 초기값 없음. 수정 모드: initialData 있음 */
  initialData?: GetAuctionResponse | null;
  auctionId?: string;
  onSubmit: (dto: CreateAuctionDto | UpdateAuctionDto, imageFile: File | null) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export default function AuctionForm({
  initialData,
  auctionId,
  onSubmit,
  submitLabel = '경매 등록하기',
  isSubmitting = false,
}: AuctionFormProps) {
  const isEdit = !!initialData && !!auctionId;
  const [image, setImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<AuctionFormValues>(
    initialData ? auctionToFormValues(initialData) : INITIAL_VALUES,
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValueChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && !image) {
      alert('상품 이미지를 등록해주세요.');
      return;
    }
    if (!formData.brand || !formData.brand.trim()) {
      alert('브랜드를 선택해주세요.');
      return;
    }
    if (formData.size === '' || formData.size == null) {
      alert('사이즈를 선택해주세요.');
      return;
    }

    const startPrice = parseInt(formData.startPrice, 10);
    const buyNowPrice = formData.buyNowPrice
      ? parseInt(formData.buyNowPrice, 10)
      : undefined;
    const minimumIncrement = parseInt(formData.minimumIncrement, 10);

    if (Number.isNaN(startPrice) || startPrice < 0) {
      alert('시작 가격을 올바르게 입력해주세요.');
      return;
    }
    if (Number.isNaN(minimumIncrement) || minimumIncrement < 1) {
      alert('최소 입찰 단위를 선택해주세요.');
      return;
    }
    if (!formData.endTime) {
      alert('경매 종료 일시를 입력해주세요.');
      return;
    }

    if (isEdit) {
      const dto: UpdateAuctionDto = {
        name: formData.modelName,
        brand: formData.brand,
        color: formData.color,
        description: formData.description,
        size: String(formData.size),
        startPrice,
        buyNowPrice: buyNowPrice ?? undefined,
        minimumIncrement,
        endTime: new Date(formData.endTime).toISOString(),
      };
      await onSubmit(dto, image);
    } else {
      const dto: CreateAuctionDto = {
        modelName: formData.modelName,
        brand: formData.brand,
        color: formData.color,
        description: formData.description,
        imageUrl: '', // onSubmit에서 업로드 후 채움
        size: String(formData.size),
        startPrice,
        ...(buyNowPrice != null && { buyNowPrice }),
        minimumIncrement,
        endTime: new Date(formData.endTime).toISOString(),
      };
      await onSubmit(dto, image);
    }
  };

  const brandOptions = BRANDS.map((brand) => ({ label: brand, value: brand }));
  const sizeOptions = SIZES.map((size) => ({ label: `${size} mm`, value: String(size) }));

  return (
    <div className="min-h-screen bg-bg-main pb-24 max-w-6xl mx-auto px-5 py-8 md:py-16">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20"
      >
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <AuctionImageUpload
              onImageChange={setImage}
              initialImageUrl={initialData?.imageUrl}
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-16">
          <section className="space-y-10">
            <div className="border-b border-border-main pb-4">
              <h2 className="text-xl font-black text-text-main tracking-tight">상품 정보</h2>
              <p className="text-xs text-text-muted mt-1">
                등록하려는 스니커즈의 상세 정보를 입력해주세요.
              </p>
            </div>

            <div className="space-y-8">
              <Input
                label="모델명"
                required
                name="modelName"
                value={formData.modelName}
                onChange={handleChange}
                placeholder="예: Jordan 1 Retro High OG Chicago"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Select
                  label="브랜드"
                  required
                  options={brandOptions}
                  value={formData.brand}
                  onChange={(val) => handleValueChange('brand', String(val))}
                  placeholder="선택하세요"
                />

                <Select
                  label="사이즈 (mm)"
                  required
                  options={sizeOptions}
                  value={formData.size}
                  onChange={(val) => handleValueChange('size', val)}
                  placeholder="선택하세요"
                />
              </div>

              <Input
                label="컬러"
                required
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="예: Red / White / Black"
              />

              <TextArea
                label="상세 설명"
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="상품의 상태(착용 횟수, 하자 유무 등)를 자세히 적어주세요."
              />
            </div>
          </section>

          <section className="space-y-10">
            <div className="border-b border-border-main pb-4">
              <h2 className="text-xl font-black text-text-main tracking-tight">가격 및 기간</h2>
              <p className="text-xs text-text-muted mt-1">
                경매의 시작가와 종료 시간을 설정해주세요.
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Input
                  label="시작 가격"
                  required
                  type="number"
                  name="startPrice"
                  value={formData.startPrice}
                  onChange={handleChange}
                  placeholder="0"
                  suffix="원"
                />

                <Input
                  label="즉시 구매가"
                  type="number"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={handleChange}
                  placeholder="입력 시 즉시 구매 가능"
                  suffix="원"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Select
                  label="최소 입찰 단위"
                  required
                  options={INCREMENT_OPTIONS}
                  value={formData.minimumIncrement}
                  onChange={(val) => handleValueChange('minimumIncrement', String(val))}
                />

                <Input
                  label="경매 종료 일시"
                  required
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="p-5 bg-bg-sub/50 rounded-2xl flex gap-4 border border-border-main/30">
              <Info size={20} className="text-text-muted shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-text-main">주의사항</p>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  경매가 시작된 이후에는 정보를 수정하거나 삭제할 수 없습니다. 입력하신 정보를
                  다시 한번 확인해주세요. 허위 정보 등록 시 서비스 이용이 제한될 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-border-main">
            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              disabled={isSubmitting}
              className="h-16 text-lg font-bold rounded-2xl bg-text-main text-bg-main hover:bg-text-main/90 border-none shadow-xl shadow-black/5"
            >
              {isSubmitting ? '처리 중...' : submitLabel}
            </Button>
            <p className="text-center text-[11px] text-text-muted mt-4">
              &apos;경매 등록하기&apos;를 누르면 이용약관 및 운영정책에 동의하는 것으로
              간주됩니다.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
