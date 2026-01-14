'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to track if component is mounted.
 * Useful for preventing state updates after unmount and handling SSR.
 *
 * @example
 * const isMounted = useMounted();
 *
 * // Only render client-specific UI after mount
 * if (!isMounted) return null;
 *
 * @example
 * const isMounted = useMounted();
 *
 * useEffect(() => {
 *   fetchData().then(data => {
 *     if (isMounted) {
 *       setData(data);
 *     }
 *   });
 * }, [isMounted]);
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  // Intentional: SSR hydration pattern requires setState in useEffect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Hook that returns a ref tracking mounted state.
 * Useful for async operations that may complete after unmount.
 *
 * @example
 * const mountedRef = useMountedRef();
 *
 * const handleClick = async () => {
 *   const result = await someAsyncOperation();
 *   if (mountedRef.current) {
 *     setResult(result);
 *   }
 * };
 */
export function useMountedRef(): React.MutableRefObject<boolean> {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

/**
 * Hook that provides a safe setState that only updates if mounted.
 * Prevents "Can't perform a React state update on an unmounted component" warnings.
 *
 * @example
 * const [data, setData] = useState(null);
 * const safeSetData = useSafeState(setData);
 *
 * useEffect(() => {
 *   fetchData().then(safeSetData);
 * }, []);
 */
export function useSafeState<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
): React.Dispatch<React.SetStateAction<T>> {
  const mountedRef = useMountedRef();

  return useCallback(
    (value: React.SetStateAction<T>) => {
      if (mountedRef.current) {
        setState(value);
      }
    },
    [setState, mountedRef]
  );
}

/**
 * Hook that provides state that only updates if component is mounted.
 * Combines useState with mount safety.
 *
 * @example
 * const [data, setData, isMounted] = useSafeStateValue<User | null>(null);
 *
 * useEffect(() => {
 *   fetchUser().then(setData);
 * }, []);
 */
export function useSafeStateValue<T>(
  initialValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const isMounted = useMounted();
  const mountedRef = useMountedRef();

  const safeSetValue = useCallback(
    (newValue: React.SetStateAction<T>) => {
      if (mountedRef.current) {
        setValue(newValue);
      }
    },
    [mountedRef]
  );

  // Return state-based isMounted instead of ref.current to avoid reading ref during render
  return [value, safeSetValue, isMounted];
}
