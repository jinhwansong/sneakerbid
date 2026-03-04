'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'danger',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (firstFocusable ?? dialogRef.current)?.focus();
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('[ConfirmModal] onConfirm failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-bg-main border border-border-main shadow-2xl p-6"
        >
          <h3 id={titleId} className="text-lg font-black text-text-main mb-2">
            {title}
          </h3>
          <p id={messageId} className="text-sm text-text-sub mb-6">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={busy}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={busy}
              className={
                variant === 'danger'
                  ? 'bg-status-urgent hover:bg-status-urgent/90 text-white'
                  : ''
              }
            >
              {busy ? '처리 중...' : confirmLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
