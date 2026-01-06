'use client';

/**
 * Editable Cell Component
 *
 * Airtable-style inline editing with type-specific editors
 * - Click to select, double-click/Enter to edit
 * - Type-specific editors (text, number, date, select, boolean)
 * - Keyboard navigation support
 * - Auto-save on blur with optimistic updates
 */

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

export type CellDataType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

export type CellSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface EditableCellProps {
  value: unknown;
  dataType: CellDataType;
  enumeration?: Record<string, string>;
  required?: boolean;
  hasError?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  rowIndex: number;
  columnCode: string;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  onSave?: (value: unknown) => Promise<void>;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'tab-back') => void;
  saveStatus?: CellSaveStatus;
}

export function EditableCell({
  value,
  dataType,
  enumeration,
  required,
  hasError,
  isSelected,
  isEditing,
  rowIndex,
  columnCode,
  onSelect,
  onStartEdit,
  onEndEdit,
  onSave,
  onNavigate,
  saveStatus = 'idle',
}: EditableCellProps) {
  const [editValue, setEditValue] = useState<unknown>(value);
  const [localSaveStatus, setLocalSaveStatus] = useState<CellSaveStatus>(saveStatus);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sync with parent save status
  useEffect(() => {
    setLocalSaveStatus(saveStatus);
  }, [saveStatus]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      onEndEdit?.();
      return;
    }

    setLocalSaveStatus('saving');
    try {
      await onSave?.(editValue);
      setLocalSaveStatus('saved');
      // Reset to idle after a short delay
      setTimeout(() => setLocalSaveStatus('idle'), 1500);
    } catch {
      setLocalSaveStatus('error');
    }
    onEndEdit?.();
  }, [editValue, value, onSave, onEndEdit]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    onEndEdit?.();
  }, [value, onEndEdit]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isEditing) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSave();
          break;
        case 'Escape':
          e.preventDefault();
          handleCancel();
          break;
        case 'Tab':
          e.preventDefault();
          handleSave();
          onNavigate?.(e.shiftKey ? 'tab-back' : 'tab');
          break;
      }
    } else if (isSelected) {
      switch (e.key) {
        case 'Enter':
        case 'F2':
          e.preventDefault();
          onStartEdit?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onNavigate?.('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onNavigate?.('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate?.('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigate?.('right');
          break;
        case 'Tab':
          e.preventDefault();
          onNavigate?.(e.shiftKey ? 'tab-back' : 'tab');
          break;
      }
    }
  }, [isEditing, isSelected, handleSave, handleCancel, onStartEdit, onNavigate]);

  const handleClick = useCallback(() => {
    if (!isSelected) {
      onSelect?.();
    }
  }, [isSelected, onSelect]);

  const handleDoubleClick = useCallback(() => {
    onStartEdit?.();
  }, [onStartEdit]);

  // Determine empty state
  const isEmpty = value === null || value === undefined || value === '';
  const isMissingRequired = required && isEmpty;

  // Render save status indicator
  const renderStatusIndicator = () => {
    switch (localSaveStatus) {
      case 'saving':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'saved':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  // Render editor based on data type
  const renderEditor = () => {
    switch (dataType) {
      case 'boolean':
        return (
          <div className="flex items-center justify-center h-full">
            <Checkbox
              checked={editValue === true || editValue === 'true'}
              onCheckedChange={(checked) => {
                setEditValue(checked);
                // Auto-save booleans immediately
                setTimeout(() => handleSave(), 0);
              }}
            />
          </div>
        );

      case 'date':
        return (
          <Popover open={true} onOpenChange={(open) => !open && handleSave()}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-8 text-sm',
                  !editValue && 'text-muted-foreground'
                )}
              >
                {editValue ? format(parseISO(String(editValue)), 'yyyy-MM-dd') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editValue ? parseISO(String(editValue)) : undefined}
                onSelect={(date) => {
                  if (date && isValid(date)) {
                    setEditValue(format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'enum':
        return (
          <Select
            value={String(editValue || '')}
            onValueChange={(val) => {
              setEditValue(val);
              // Auto-save selects immediately
              setTimeout(() => handleSave(), 0);
            }}
            open={true}
            onOpenChange={(open) => !open && handleSave()}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {enumeration && Object.entries(enumeration).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editValue === null || editValue === undefined ? '' : String(editValue)}
            onChange={(e) => setEditValue(e.target.value === '' ? null : parseFloat(e.target.value))}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm font-mono"
          />
        );

      default: // string
        return (
          <Input
            ref={inputRef}
            type="text"
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value || null)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        );
    }
  };

  // Render display value
  const renderDisplayValue = () => {
    if (isEmpty) {
      if (isMissingRequired) {
        return (
          <span className={cn(
            'inline-flex items-center gap-1 text-amber-700 font-medium text-sm',
            hasError && 'text-red-600'
          )}>
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Missing
          </span>
        );
      }
      return (
        <span className={cn(
          'text-muted-foreground italic text-sm',
          hasError && 'text-red-500'
        )}>
          —
        </span>
      );
    }

    const stringValue = String(value);

    switch (dataType) {
      case 'date':
        try {
          const date = parseISO(stringValue);
          if (isValid(date)) {
            return <span className="font-mono text-sm">{format(date, 'yyyy-MM-dd')}</span>;
          }
        } catch {
          // Fall through
        }
        return <span className="font-mono text-sm">{stringValue}</span>;

      case 'boolean':
        return (
          <Checkbox
            checked={value === true || value === 'true'}
            disabled
            className="pointer-events-none"
          />
        );

      case 'enum':
        const label = enumeration?.[stringValue] || stringValue;
        return (
          <span className="font-mono text-xs px-1.5 py-0.5 bg-muted rounded">
            {label}
          </span>
        );

      case 'number':
        const num = typeof value === 'number' ? value : parseFloat(stringValue);
        return (
          <span className="font-mono text-sm">
            {isNaN(num) ? stringValue : num.toLocaleString()}
          </span>
        );

      default:
        return (
          <span className={cn(
            'text-sm',
            stringValue.length > 40 && 'truncate max-w-[180px] block'
          )}>
            {stringValue}
          </span>
        );
    }
  };

  return (
    <div
      ref={cellRef}
      className={cn(
        'relative h-full min-h-[40px] px-3 py-2 cursor-pointer transition-all',
        'border-2 border-transparent',
        isSelected && 'border-primary bg-primary/5',
        isEditing && 'border-primary bg-background shadow-sm',
        hasError && 'bg-red-100',
        isMissingRequired && !hasError && 'bg-amber-50',
        !isSelected && !isEditing && 'hover:bg-muted/50'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={!isEditing ? handleKeyDown : undefined}
      tabIndex={isSelected ? 0 : -1}
      role="gridcell"
      aria-selected={isSelected}
      aria-readonly={!isEditing}
      data-row={rowIndex}
      data-column={columnCode}
    >
      <div className="flex items-center gap-2 h-full">
        <div className="flex-1 min-w-0">
          {isEditing ? renderEditor() : renderDisplayValue()}
        </div>
        {!isEditing && localSaveStatus !== 'idle' && (
          <div className="flex-shrink-0">
            {renderStatusIndicator()}
          </div>
        )}
      </div>
    </div>
  );
}
