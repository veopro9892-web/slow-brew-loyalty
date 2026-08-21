import { useSyncExternalStore, useRef } from 'react';

function emptySubscribe() {
  return () => {};
}

/**
 * Reads a value from localStorage in a way that is safe for SSR.
 * Returns `null` on the server and during the first client render,
 * then the real value after mount — avoiding hydration mismatches.
 */
export function useLocalStorage<T>(
  key: string,
  deserialize: (raw: string) => T,
  fallback: T,
): T {
  const cacheRef = useRef<{ raw: string; value: T } | null>(null);

  const getSnapshot = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      // Return cached value if the raw string hasn't changed
      if (cacheRef.current?.raw === raw) return cacheRef.current.value;
      const value = deserialize(raw);
      cacheRef.current = { raw, value };
      return value;
    } catch {
      return fallback;
    }
  };

  const getServerSnapshot = (): T => fallback;

  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
