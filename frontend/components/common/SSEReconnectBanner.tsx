'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { useSSEConnectionStore, selectIsReconnecting } from '@/store/useSSEConnectionStore';

export default function SSEReconnectBanner() {
  const isReconnecting = useSSEConnectionStore(selectIsReconnecting);

  return (
    <AnimatePresence>
      {isReconnecting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2.5 bg-status-urgent/90 text-white text-sm font-bold backdrop-blur-sm"
        >
          <Wifi className="h-4 w-4 animate-pulse" />
          <span>실시간 연결이 끊어졌습니다. 재연결 중...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
