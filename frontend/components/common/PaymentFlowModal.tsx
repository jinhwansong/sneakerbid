'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type Step = 'confirm' | 'creating' | 'paying' | 'complete' | 'error';

interface PaymentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  modelName: string;
  onConfirm: (setStep: (s: Step) => void) => Promise<{ success: boolean }>;
}

export default function PaymentFlowModal({
  isOpen,
  onClose,
  price,
  modelName,
  onConfirm,
}: PaymentFlowModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    setErrorMsg('');
    setStep('creating');
    try {
      const result = await onConfirm(setStep);
      setStep(result.success ? 'complete' : 'error');
      if (!result.success) setErrorMsg('결제 처리 중 오류가 발생했습니다.');
    } catch (err) {
      setStep('error');
      setErrorMsg(err instanceof Error ? err.message : '결제에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-overlay"
        onClick={
          step === 'confirm' || step === 'complete' || step === 'error'
            ? handleClose
            : undefined
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-bg-main border border-border-main shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <h3 className="text-lg font-black text-text-main">
              {step === 'confirm' && '즉시 구매'}
              {step === 'creating' && '주문 생성 중'}
              {step === 'paying' && '결제 진행 중'}
              {step === 'complete' && '결제 완료'}
              {step === 'error' && '오류'}
            </h3>
            {(step === 'confirm' || step === 'complete' || step === 'error') && (
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-bg-sub transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            {step === 'confirm' && (
              <>
                <p className="text-text-sub">
                  <span className="font-bold text-text-main">{modelName}</span>
                  <br />
                  {formatPrice(price)}원에 즉시 구매하시겠습니까?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl border border-border-main font-bold text-text-muted hover:bg-bg-sub transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-xl bg-bg-accent text-text-inverse font-bold hover:brightness-110 transition-all"
                  >
                    구매하기
                  </button>
                </div>
              </>
            )}

            {(step === 'creating' || step === 'paying') && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
                <p className="text-sm font-bold text-text-sub">
                  {step === 'creating' ? '주문을 생성하고 있습니다...' : '결제를 진행하고 있습니다...'}
                </p>
              </div>
            )}

            {step === 'complete' && (
              <>
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle2 className="h-16 w-16 text-status-active" />
                  <p className="text-lg font-black text-text-main">
                    결제가 완료되었습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-xl bg-bg-accent text-text-inverse font-bold hover:brightness-110 transition-all"
                >
                  확인
                </button>
              </>
            )}

            {step === 'error' && (
              <>
                <p className="text-status-urgent font-bold text-center">
                  {errorMsg}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl bg-bg-accent text-text-inverse font-bold hover:brightness-110 transition-all"
                  >
                    확인
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
