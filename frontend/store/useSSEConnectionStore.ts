import { create } from 'zustand';

interface SSEConnectionState {
  reconnectingCount: number;
  addReconnecting: () => void;
  removeReconnecting: () => void;
}

export const useSSEConnectionStore = create<SSEConnectionState>((set) => ({
  reconnectingCount: 0,
  addReconnecting: () =>
    set((s) => ({ reconnectingCount: s.reconnectingCount + 1 })),
  removeReconnecting: () =>
    set((s) => ({
      reconnectingCount: Math.max(0, s.reconnectingCount - 1),
    })),
}));

export const selectIsReconnecting = (s: SSEConnectionState) =>
  s.reconnectingCount > 0;
