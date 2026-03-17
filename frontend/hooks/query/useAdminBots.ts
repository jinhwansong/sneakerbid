import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from './queryKeys';

export function useAdminBots() {
  return useQuery({
    queryKey: queryKeys.admin.bots(),
    queryFn: () => api.admin.getBots(),
  });
}

export function useAdminSetBotEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ botId, enabled }: { botId: string; enabled: boolean }) =>
      api.admin.setBotEnabled(botId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.bots() });
    },
  });
}
