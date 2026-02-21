import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import MainPageContent from '@/components/main/MainPageContent';
import { queryKeys } from '@/hooks/query/queryKeys';
import { api } from '@/lib/api';

export default async function Home() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.auctions.main,
    queryFn: () => api.auctions.getMain(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainPageContent />
    </HydrationBoundary>
  );
}
