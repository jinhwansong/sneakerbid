'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSyncExternalStore } from 'react';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  // 하이드레이션 오류 방지를 위해 mounted 상태 확인
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--secondary-bg) text-(--text-title) hover:bg-(--primary-soft) transition-colors"
      aria-label="테마 변경"
    >
      {!mounted ? (
        <div className="h-5 w-5" />
      ) : isDark ? (
        <Sun size={20} className="text-amber-500" />
      ) : (
        <Moon size={20} className="text-slate-600" />
      )}
    </motion.button>
  );
}
