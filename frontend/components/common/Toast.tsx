'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Toast: React.FC = () => {
  const { message, type, isVisible, hideToast } = useToastStore();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hideToast]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-fit px-4">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-[24px] shadow-2xl border backdrop-blur-md",
              type === 'success' 
                ? "bg-bg-main/90 border-border-main text-text-main" 
                : "bg-status-urgent/10 border-status-urgent/20 text-status-urgent"
            )}
          >
            {type === 'success' ? (
              <CheckCircle2 size={20} className="text-status-active" />
            ) : (
              <AlertCircle size={20} className="text-status-urgent" />
            )}
            <span className="text-sm font-bold tracking-tight whitespace-nowrap">
              {message}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
