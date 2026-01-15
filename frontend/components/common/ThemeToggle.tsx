'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1, rotate: isDark ? 15 : -15 }}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-main shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border-main backdrop-blur-md transition-all hover:shadow-brand-primary/20 dark:shadow-white/5"
        aria-label="테마 토글"
      >
        <div className="absolute inset-0 rounded-2xl bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={24} className="text-amber-500 fill-amber-500/20" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={24} className="text-slate-700 fill-slate-700/10" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
