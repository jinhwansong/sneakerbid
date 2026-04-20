import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { withQueryDefaults } from '@/hooks/withQueryDefaults';
import { queryKeys } from './queryKeys';

export function useNotificationsList(enabled: boolean) {
  return useQuery(
    withQueryDefaults({
      queryKey: queryKeys.notifications.list(),
      queryFn: async () => {
        const res = await api.notifications.list({ limit: 30 });
        return {
          items: res.items ?? [],
          nextCursor: res.nextCursor ?? null,
        };
      },
      enabled,
    }),
  );
}

export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery(
    withQueryDefaults({
      queryKey: queryKeys.notifications.unreadCount(),
      queryFn: async () => {
        const res = await api.notifications.unreadCount();
        return res.count ?? 0;
      },
      enabled,
      staleTime: 30_000,
    }),
  );
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
}
