import { useMountedStore } from '@/store/useMountedStore';
import { useEffect } from 'react';

export function useIsMounted() {
  const {mounted, setMounted} = useMountedStore();

  useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  return mounted;
}