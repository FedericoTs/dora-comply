'use client';

import { useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddRowZoneProps {
  onAddRow: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function AddRowZone({ onAddRow, disabled = false, className }: AddRowZoneProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    try {
      await onAddRow();
    } finally {
      setIsAdding(false);
    }
  }, [onAddRow, disabled, isAdding]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isAdding}
      className={cn(
        // Base styles
        'w-full flex items-center justify-center gap-2 py-3 px-4',
        'border-2 border-dashed rounded-lg',
        'text-sm font-medium',
        'transition-all duration-200 ease-out',
        // Default state
        'border-muted-foreground/20 text-muted-foreground/60',
        'bg-muted/30',
        // Hover state
        'hover:border-primary/40 hover:text-primary/80 hover:bg-primary/5',
        // Focus state
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted-foreground/20 disabled:hover:text-muted-foreground/60 disabled:hover:bg-muted/30',
        className
      )}
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Adding row...</span>
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          <span>Add row</span>
          <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">
            {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </kbd>
        </>
      )}
    </button>
  );
}

/**
 * Compact version for inline use
 */
export function AddRowButton({ onAddRow, disabled = false, className }: AddRowZoneProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    try {
      await onAddRow();
    } finally {
      setIsAdding(false);
    }
  }, [onAddRow, disabled, isAdding]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isAdding}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5',
        'text-sm font-medium rounded-md',
        'border border-dashed',
        'transition-colors duration-150',
        'border-muted-foreground/30 text-muted-foreground',
        'hover:border-primary/50 hover:text-primary hover:bg-primary/5',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isAdding ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      <span>{isAdding ? 'Adding...' : 'Add'}</span>
    </button>
  );
}
