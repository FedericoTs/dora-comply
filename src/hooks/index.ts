/**
 * Custom Hooks Module
 * Centralized exports for all custom React hooks
 */

// Async operations
export {
  useAsyncAction,
  type AsyncActionState,
  type UseAsyncActionReturn,
} from './use-async-action';

// State persistence
export {
  useLocalStorage,
  useLocalStorageValue,
} from './use-local-storage';

// Mount/lifecycle utilities
export {
  useMounted,
  useMountedRef,
  useSafeState,
  useSafeStateValue,
} from './use-mounted';

// Value utilities
export { useDebounce } from './use-debounce';

// URL/Navigation
export { useUrlFilters } from './use-url-filters';

// Filter state management
export {
  useFilterState,
  type SortDirection,
  type UseFilterStateOptions,
  type UseFilterStateReturn,
} from './use-filter-state';

// Dialog state management
export {
  useDialogState,
  useDialogWithData,
  type UseDialogStateOptions,
  type UseDialogStateReturn,
  type UseDialogWithDataReturn,
} from './use-dialog-state';
