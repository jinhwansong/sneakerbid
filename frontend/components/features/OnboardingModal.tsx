'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 세션당 1회만 보여주기
    const hasSeen = sessionStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1000); // 진입 1초 후 부드럽게 등장
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenOnboarding', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-8 z-101 mx-auto max-w-[420px] overflow-hidden rounded-[32px] bg-bg-main p-8 shadow-2xl md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          >
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <Zap fill="currentColor" size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-text-main leading-tight">
                  경계 없는 스니커즈<br />입찰 경험을 시작하세요
                </h2>
                <p className="text-[13px] font-medium text-text-sub leading-relaxed">
                  본 프로젝트는 실시간 입찰 엔진의 동기화 성능을 증명하기 위해 <span className="text-brand-primary font-bold">AI 시뮬레이션 에이전트</span>가 실시간으로 입찰에 참여하고 있습니다.
                </p>
              </div>

              {/* Roadmap Features */}
              <div className="flex flex-col gap-5 py-2">
                {/* Now */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-status-active/10 text-status-active">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-text-main">시뮬레이션 가동 중</p>
                    <p className="text-[11px] text-text-muted">에이전트와 실시간 경쟁 · 게스트 입찰 즉시 반영 · 라이브 피드 트래킹</p>
                  </div>
                </div>

                {/* Next */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <UserCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-text-main">곧 만날 수 있어요 (Update)</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">입찰 내역 영구 저장 · 낙찰/관심 경매 실시간 알림<br />멀티 디바이스 동기화 · 나만의 스니커즈 보관함</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleClose}
                  variant="secondary"
                  size="xl"
                  fullWidth
                >
                  게스트로 즉시 시작하기
                </Button>
                <p className="text-center text-[11px] font-medium text-text-muted">
                  추후 소셜 로그인 연동을 통해 모든 기능이 통합될 예정입니다.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
