'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * State for async action
 */
export interface AsyncActionState<TData> {
  data: TData | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Return type for useAsyncAction hook
 */
export interface UseAsyncActionReturn<TData, TArgs extends unknown[]> {
  /** Execute the async action */
  execute: (...args: TArgs) => Promise<TData | null>;
  /** Current state */
  state: AsyncActionState<TData>;
  /** Reset state to initial values */
  reset: () => void;
  /** Is the action currently loading */
  isLoading: boolean;
  /** The data from the last successful execution */
  data: TData | null;
  /** The error from the last failed execution */
  error: Error | null;
}

interface UseAsyncActionOptions<TData> {
  /** Called on successful execution */
  onSuccess?: (data: TData) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called after execution (success or error) */
  onSettled?: () => void;
  /** Initial data value */
  initialData?: TData;
}

const initialState = <TData>(): AsyncActionState<TData> => ({
  data: null,
  error: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

/**
 * Hook for handling async actions with loading, error, and success states.
 *
 * @example
 * const { execute, isLoading, data, error } = useAsyncAction(
 *   async (id: string) => {
 *     const result = await fetchVendor(id);
 *     return result;
 *   },
 *   {
 *     onSuccess: (data) => toast.success('Vendor loaded'),
 *     onError: (error) => toast.error(error.message),
 *   }
 * );
 *
 * // Execute the action
 * await execute('vendor-123');
 */
export function useAsyncAction<TData, TArgs extends unknown[] = []>(
  action: (...args: TArgs) => Promise<TData>,
  options: UseAsyncActionOptions<TData> = {}
): UseAsyncActionReturn<TData, TArgs> {
  const { onSuccess, onError, onSettled, initialData } = options;

  const [state, setState] = useState<AsyncActionState<TData>>(() => ({
    ...initialState<TData>(),
    data: initialData ?? null,
  }));

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);

  // Track the current execution to handle race conditions
  const executionIdRef = useRef(0);

  const execute = useCallback(
    async (...args: TArgs): Promise<TData | null> => {
      const currentExecutionId = ++executionIdRef.current;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }));

      try {
        const result = await action(...args);

        // Only update state if this is still the latest execution and component is mounted
        if (currentExecutionId === executionIdRef.current && mountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
          });

          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Only update state if this is still the latest execution and component is mounted
        if (currentExecutionId === executionIdRef.current && mountedRef.current) {
          setState((prev) => ({
            ...prev,
            error,
            isLoading: false,
            isSuccess: false,
            isError: true,
          }));

          onError?.(error);
        }

        return null;
      } finally {
        if (currentExecutionId === executionIdRef.current && mountedRef.current) {
          onSettled?.();
        }
      }
    },
    [action, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setState({
      ...initialState<TData>(),
      data: initialData ?? null,
    });
  }, [initialData]);

  return {
    execute,
    state,
    reset,
    isLoading: state.isLoading,
    data: state.data,
    error: state.error,
  };
}
