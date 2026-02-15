import { RefObject, useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
  eventType: 'mousedown' | 'mouseup' | 'click' = 'mousedown'
): void {
  const callbackRef = useRef(callback);
  // useEffect(() => {
  //   callbackRef.current = callback;
  // }, [callback]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        callbackRef.current();
      }
    }
    document.addEventListener(eventType, handleClickOutside);
    return () => document.removeEventListener(eventType, handleClickOutside);
  }, [ref, eventType]);
}
