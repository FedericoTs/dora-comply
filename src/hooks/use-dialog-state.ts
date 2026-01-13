'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Generic dialog state management hook
 *
 * Manages multiple dialog open/close states in a single hook.
 * Prevents the need for multiple useState calls for each dialog.
 *
 * @example
 * // Define your dialog keys as a type
 * type DialogKey = 'upload' | 'delete' | 'edit' | 'bulkDelete';
 *
 * // Use the hook
 * const {
 *   dialogs,
 *   isOpen,
 *   open,
 *   close,
 *   toggle,
 *   closeAll,
 *   openDialog,
 *   currentDialog,
 * } = useDialogState<DialogKey>();
 *
 * // Check if a dialog is open
 * if (isOpen('upload')) { ... }
 *
 * // Open a dialog
 * <Button onClick={() => open('upload')}>Upload</Button>
 *
 * // Use in Dialog component
 * <Dialog open={isOpen('upload')} onOpenChange={(open) => open ? open('upload') : close('upload')}>
 *
 * // Or use the shorthand
 * <Dialog {...openDialog('upload')}>
 */

export interface UseDialogStateOptions<T extends string> {
  /** Initial open dialogs */
  initialOpen?: T[];
  /** Allow multiple dialogs to be open at once (default: false) */
  allowMultiple?: boolean;
  /** Callback when any dialog opens */
  onOpen?: (key: T) => void;
  /** Callback when any dialog closes */
  onClose?: (key: T) => void;
}

export interface UseDialogStateReturn<T extends string> {
  /** Set of currently open dialog keys */
  dialogs: Set<T>;

  /** Check if a specific dialog is open */
  isOpen: (key: T) => boolean;

  /** Open a dialog */
  open: (key: T) => void;

  /** Close a dialog */
  close: (key: T) => void;

  /** Toggle a dialog */
  toggle: (key: T) => void;

  /** Close all dialogs */
  closeAll: () => void;

  /** Get props for a Dialog component { open, onOpenChange } */
  getDialogProps: (key: T) => {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };

  /** Currently open dialog (when allowMultiple is false) */
  currentDialog: T | null;

  /** Check if any dialog is open */
  hasOpenDialog: boolean;
}

export function useDialogState<T extends string>(
  options: UseDialogStateOptions<T> = {}
): UseDialogStateReturn<T> {
  const {
    initialOpen = [],
    allowMultiple = false,
    onOpen,
    onClose,
  } = options;

  const [dialogs, setDialogs] = useState<Set<T>>(new Set(initialOpen));

  // Check if a dialog is open
  const isOpen = useCallback((key: T): boolean => {
    return dialogs.has(key);
  }, [dialogs]);

  // Open a dialog
  const open = useCallback((key: T) => {
    setDialogs((prev) => {
      if (allowMultiple) {
        const next = new Set(prev);
        next.add(key);
        return next;
      }
      // Single dialog mode: close others first
      return new Set([key]);
    });
    onOpen?.(key);
  }, [allowMultiple, onOpen]);

  // Close a dialog
  const close = useCallback((key: T) => {
    setDialogs((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    onClose?.(key);
  }, [onClose]);

  // Toggle a dialog
  const toggle = useCallback((key: T) => {
    if (dialogs.has(key)) {
      close(key);
    } else {
      open(key);
    }
  }, [dialogs, close, open]);

  // Close all dialogs
  const closeAll = useCallback(() => {
    const previousDialogs = Array.from(dialogs);
    setDialogs(new Set());
    previousDialogs.forEach((key) => onClose?.(key));
  }, [dialogs, onClose]);

  // Get props for Dialog component
  const getDialogProps = useCallback((key: T) => ({
    open: dialogs.has(key),
    onOpenChange: (open: boolean) => {
      if (open) {
        setDialogs((prev) => {
          if (allowMultiple) {
            const next = new Set(prev);
            next.add(key);
            return next;
          }
          return new Set([key]);
        });
        onOpen?.(key);
      } else {
        setDialogs((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        onClose?.(key);
      }
    },
  }), [dialogs, allowMultiple, onOpen, onClose]);

  // Get the currently open dialog (when single mode)
  const currentDialog = useMemo((): T | null => {
    if (dialogs.size === 0) return null;
    return Array.from(dialogs)[0];
  }, [dialogs]);

  // Check if any dialog is open
  const hasOpenDialog = useMemo(() => dialogs.size > 0, [dialogs]);

  return {
    dialogs,
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    getDialogProps,
    currentDialog,
    hasOpenDialog,
  };
}

/**
 * Simpler version for managing a single dialog with associated data
 *
 * @example
 * const { isOpen, data, open, close, dialogProps } = useDialogWithData<Vendor>();
 *
 * // Open with data
 * <Button onClick={() => open(vendor)}>Edit</Button>
 *
 * // Use in Dialog
 * <Dialog {...dialogProps}>
 *   {data && <EditForm vendor={data} />}
 * </Dialog>
 */
export interface UseDialogWithDataReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (data: T) => void;
  close: () => void;
  toggle: (data?: T) => void;
  dialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

export function useDialogWithData<T>(
  options: {
    onOpen?: (data: T) => void;
    onClose?: () => void;
  } = {}
): UseDialogWithDataReturn<T> {
  const { onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((newData: T) => {
    setData(newData);
    setIsOpen(true);
    onOpen?.(newData);
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data to allow exit animations
    setTimeout(() => setData(null), 150);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback((newData?: T) => {
    if (isOpen) {
      close();
    } else if (newData !== undefined) {
      open(newData);
    }
  }, [isOpen, open, close]);

  const dialogProps = useMemo(() => ({
    open: isOpen,
    onOpenChange: (open: boolean) => {
      if (!open) close();
    },
  }), [isOpen, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    dialogProps,
  };
}
