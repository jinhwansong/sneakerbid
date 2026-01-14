import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'success',
  isVisible: false,
  showToast: (message, type = 'success') =>
    set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}));
