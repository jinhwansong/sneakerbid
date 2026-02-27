'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Chrome, MessageCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/store/useToastStore';
import { api } from '@/lib/api';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToastStore();

  // URL 쿼리 파라미터에서 에러 확인
  const errorParam = searchParams.get('error');
  const error =
    errorParam === 'auth_failed'
      ? '로그인에 실패했습니다. 다시 시도해주세요.'
      : null;

  const handleLogin = (provider: 'google' | 'kakao') => {

    try {
      if (provider === 'google') {
        api.auth.google();
      } else {
        api.auth.kakao();
      }
    } catch {
      showToast('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-bg-main px-6 py-12">
      <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 카드 컨테이너 */}
        <div className="bg-bg-main rounded-[32px] border border-border-main p-8 md:p-12 shadow-card-lg">
          {/* 상단 헤더 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black tracking-tightest text-text-main mb-3 uppercase">
              Lace<span className="text-brand-primary">BID</span>
            </h1>
            <p className="text-sm font-medium text-text-sub tracking-tight">
              실시간 경매에 참여하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-status-urgent/5 border border-status-urgent/10 rounded-xl animate-in zoom-in-95">
              <AlertCircle size={14} className="text-status-urgent shrink-0" />
              <p className="text-[11px] font-bold text-status-urgent leading-none">
                {error}
              </p>
            </div>
          )}

          {/* SNS 로그인 버튼 그룹 */}
          <div className="space-y-3">
            {/* Google 로그인 */}
            <button
              onClick={() => handleLogin('google')}
              className={cn(
                'group relative w-full h-[56px] flex items-center justify-center rounded-xl border border-border-main bg-white transition-all duration-300',
                'hover:bg-gray-50 hover:border-text-muted/30 active:scale-[0.98]',
               
              )}
            >
              <div className="absolute left-5">
                <Chrome size={20} className="text-[#4285F4]" />
              </div>
              <span className="text-sm font-black text-text-main">
                Google로 시작하기
              </span>
            </button>

            {/* Kakao 로그인 */}
            <button
              onClick={() => handleLogin('kakao')}
              className={cn(
                'group relative w-full h-[56px] flex items-center justify-center rounded-xl bg-[#FEE500] transition-all duration-300',
                'hover:bg-[#FDD835] active:scale-[0.98]',
              )}
            >
              <div className="absolute left-5">
                <MessageCircle
                  size={20}
                  className="fill-deep-navy text-deep-navy"
                />
              </div>
              <span className="text-sm font-black text-deep-navy">
                카카오로 시작하기
              </span>
            </button>
          </div>

          {/* 하단 안내 */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-text-muted font-medium leading-relaxed px-4">
              로그인 시 서비스
              <span className="text-text-sub underline underline-offset-2 cursor-pointer">
                이용약관
              </span>
              및
              <span className="text-text-sub underline underline-offset-2 cursor-pointer">
                개인정보 처리방침
              </span>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
