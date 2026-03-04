'use client';

import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/util/cn';

interface AuctionImageUploadProps {
  onImageChange: (file: File | null) => void;
  /** 수정 시 기존 이미지 URL (있으면 미리 표시) */
  initialImageUrl?: string | null;
  className?: string;
}

export default function AuctionImageUpload({
  onImageChange,
  initialImageUrl,
  className,
}: AuctionImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl ?? null);
  const [newFile, setNewFile] = useState<File | null>(null);

  // initialImageUrl이 바뀌면 (수정 페이지 로드 시) preview 갱신
  React.useEffect(() => {
    if (initialImageUrl && !newFile) {
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl, newFile]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setNewFile(file);
    onImageChange(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setNewFile(null);
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between lg:hidden">
        <label className="text-[13px] font-bold text-text-main">
          상품 이미지 <span className="text-status-urgent">*</span>
        </label>
        <span className="text-[11px] text-text-muted">
          정사각형 이미지를 권장합니다.
        </span>
      </div>
      
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative aspect-square w-full rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group',
          isDragging
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-border-main bg-bg-card hover:border-text-muted hover:bg-bg-sub/30',
          previewUrl && 'border-none shadow-inner'
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-black/50 text-text-main dark:text-white shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 p-8">
              <div className="w-16 h-16 rounded-full bg-bg-main flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Upload className="text-text-muted" size={28} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-main mb-1">
                  이미지 업로드
                </p>
                <p className="text-[11px] text-text-muted">
                  클릭하거나 파일을 드래그하세요
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="hidden lg:block">
        <div className="p-4 bg-bg-sub/50 rounded-xl border border-border-main/50">
          <h4 className="text-[12px] font-bold text-text-main mb-2">이미지 등록 가이드</h4>
          <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-4">
            <li>상품의 정면, 측면, 뒷면이 잘 보이도록 촬영해주세요.</li>
            <li>배경이 깔끔한 곳에서 촬영하면 낙찰 확률이 높아집니다.</li>
            <li>정사각형(1:1) 비율의 이미지를 권장합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
