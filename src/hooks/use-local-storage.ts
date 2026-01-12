'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Options for useLocalStorage hook
 */
interface UseLocalStorageOptions<T> {
  /** Custom serializer (defaults to JSON.stringify) */
  serializer?: (value: T) => string;
  /** Custom deserializer (defaults to JSON.parse) */
  deserializer?: (value: string) => T;
}

/**
 * Hook for persisting state in localStorage with type safety.
 * Handles SSR gracefully by initializing with the default value on the server.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // Update the value
 * setTheme('dark');
 *
 * // Remove from storage
 * setTheme(undefined);
 *
 * @example
 * // With complex types
 * const [filters, setFilters] = useLocalStorage('vendor-filters', {
 *   tier: [],
 *   status: ['active'],
 * });
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T) | undefined) => void] {
  const { serializer = JSON.stringify, deserializer = JSON.parse } = options;

  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Handle storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer]);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T) | undefined) => {
      try {
        if (value === undefined) {
          // Remove from storage
          window.localStorage.removeItem(key);
          setStoredValue(initialValue);
          return;
        }

        // Handle function updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, serializer(valueToStore));
        setStoredValue(valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, initialValue, serializer]
  );

  return [storedValue, setValue];
}

/**
 * Hook for reading localStorage without reactivity.
 * Useful for one-time reads or when you don't need to track changes.
 *
 * @example
 * const savedTheme = useLocalStorageValue('theme', 'light');
 */
export function useLocalStorageValue<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch {
      // Ignore errors
    }
  }, [key]);

  return value;
}
