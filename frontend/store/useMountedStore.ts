import { create } from 'zustand';

interface MountedState {
  mounted: boolean;
  setMounted: (value: boolean) => void;
}

export const useMountedStore = create<MountedState>((set) => ({
  mounted: false,
  setMounted: (value: boolean) => set({ mounted: value }),
}));
