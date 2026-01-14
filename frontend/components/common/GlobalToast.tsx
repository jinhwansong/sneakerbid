'use client';

import { useToastStore } from '@/store/useToastStore';
import Toast from './Toast';

export default function GlobalToast() {
  const { message, type, isVisible, hideToast } = useToastStore();

  return (
    <Toast
      message={message}
      type={type}
      isVisible={isVisible}
      onClose={hideToast}
    />
  );
}
