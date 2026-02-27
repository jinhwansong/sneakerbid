import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions<T> {
  data: T[];
  pageSize?: number;
  delayMs?: number;
}

export const useInfiniteScroll = <T,>({
  data,
  pageSize = 4,
  delayMs = 800,
}: UseInfiniteScrollOptions<T>) => {
  const [items, setItems] = useState<T[]>(() => data.slice(0, pageSize));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(data.length > pageSize);

  const dataRef = useRef(data);
  const itemsRef = useRef(items);

  useEffect(() => {
    dataRef.current = data;
    itemsRef.current = items;
  }, [data, items]);

  const reset = useCallback(() => {
    const source = dataRef.current;
    setItems(source.slice(0, pageSize));
    setHasMore(source.length > pageSize);
    setIsLoading(false);
  }, [pageSize]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const source = dataRef.current;
      const currentLength = itemsRef.current.length;
      const nextItems = source.slice(currentLength, currentLength + pageSize);

      if (nextItems.length > 0) {
        setItems((prev) => [...prev, ...nextItems]);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, delayMs);
  }, [delayMs, hasMore, isLoading, pageSize]);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    reset,
  };
};
