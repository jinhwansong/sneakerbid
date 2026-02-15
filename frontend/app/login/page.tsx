'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chrome, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [isLoading, setIsLoading] = useState<{
    google: boolean;
    kakao: boolean;
  }>({
    google: false,
    kakao: false,
  });

  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'google' | 'kakao') => {
    // UI 레벨 설계이므로 실제 로직은 시뮬레이션만 수행
    setIsLoading((prev) => ({ ...prev, [provider]: true }));
    setError(null);

    try {
      // 로그인 시뮬레이션 (1.5초 대기)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // 성공 시 리다이렉트 (실제 환경에서는 서버 인증 후 처리)
      console.log(`${provider} login success, redirecting to ${redirectUrl}`);
      // router.push(redirectUrl); 
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
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
              SNEAKER<span className="text-brand-primary">BID</span>
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
              disabled={isLoading.google || isLoading.kakao}
              className={cn(
                'group relative w-full h-[56px] flex items-center justify-center rounded-xl border border-border-main bg-white transition-all duration-300',
                'hover:bg-gray-50 hover:border-text-muted/30 active:scale-[0.98]',
                (isLoading.google || isLoading.kakao) &&
                  'opacity-50 cursor-not-allowed',
              )}
            >
              {isLoading.google ? (
                <Loader2 size={20} className="animate-spin text-text-muted" />
              ) : (
                <>
                  <div className="absolute left-5">
                    <Chrome size={20} className="text-[#4285F4]" />
                  </div>
                  <span className="text-sm font-black text-text-main">
                    Google로 시작하기
                  </span>
                </>
              )}
            </button>

            {/* Kakao 로그인 */}
            <button
              onClick={() => handleLogin('kakao')}
              disabled={isLoading.google || isLoading.kakao}
              className={cn(
                'group relative w-full h-[56px] flex items-center justify-center rounded-xl bg-[#FEE500] transition-all duration-300',
                'hover:bg-[#FDD835] active:scale-[0.98]',
                (isLoading.google || isLoading.kakao) &&
                  'opacity-50 cursor-not-allowed',
              )}
            >
              {isLoading.kakao ? (
                <Loader2 size={20} className="animate-spin text-[#191919]" />
              ) : (
                <>
                  <div className="absolute left-5">
                    <MessageCircle
                      size={20}
                      className="fill-[#191919] text-[#191919]"
                    />
                  </div>
                  <span className="text-sm font-black text-[#191919]">
                    카카오로 시작하기
                  </span>
                </>
              )}
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
