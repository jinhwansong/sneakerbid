'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useToastStore } from '@/store/useToastStore';
import { Button } from '@/components/common/Button';

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
  const showToast = useToastStore((s) => s.showToast);

  const handleConfirm = async () => {
    setErrorMsg('');
    setStep('creating');
    try {
      const result = await onConfirm(setStep);
      if (result.success) {
        setStep('complete');
      } else {
        setStep('error');
        setErrorMsg('결제 처리 중 오류가 발생했습니다.');
        showToast('결제에 실패했습니다.', 'error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '결제에 실패했습니다.';
      setStep('error');
      setErrorMsg(msg);
      showToast(msg, 'error');
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-1 min-w-0"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-text-muted" />
              </Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleConfirm}
                    className="flex-1"
                  >
                    구매하기
                  </Button>
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
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleClose}
                >
                  확인
                </Button>
              </>
            )}

            {step === 'error' && (
              <>
                <p className="text-status-urgent font-bold text-center">
                  {errorMsg}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleClose}
                >
                  확인
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
