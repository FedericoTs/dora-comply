'use client';

/**
 * Editable Data Table
 *
 * Full Airtable-style inline editing experience:
 * - Click to select cell, double-click/Enter to edit
 * - Arrow keys to navigate between cells
 * - Tab/Shift+Tab to move between cells
 * - Auto-save on blur with optimistic updates
 * - Visual feedback for save states
 * - Row selection for batch operations
 */

import { useState, useCallback, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { Plus, Trash2, Copy, Undo2, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EditableCell, CellSaveStatus } from './editable-cell';
import { templateIdToUrl, type RoiTemplateId } from '@/lib/roi/types';

// Serializable version of ColumnMapping (without transform function)
interface SerializableColumn {
  esaCode: string;
  dbColumn: string;
  dbTable: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  enumeration?: Record<string, string>;
}

interface CellPosition {
  row: number;
  col: number;
}

interface CellSaveState {
  [key: string]: CellSaveStatus; // key: `${rowIndex}-${colCode}`
}

interface UndoAction {
  rowIndex: number;
  columnCode: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

interface EditableDataTableProps {
  templateId: RoiTemplateId;
  data: Record<string, unknown>[];
  columns: SerializableColumn[];
  validationErrors?: Map<number, Set<string>>;
  onCellUpdate?: (rowIndex: number, columnCode: string, value: unknown) => Promise<void>;
  onRowAdd?: () => Promise<void>;
  onRowDelete?: (rowIndices: number[]) => Promise<void>;
}

export function EditableDataTable({
  templateId,
  data,
  columns,
  validationErrors,
  onCellUpdate,
  onRowAdd,
  onRowDelete,
}: EditableDataTableProps) {
  // Selection state
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Save states
  const [cellSaveStates, setCellSaveStates] = useState<CellSaveState>({});

  // Undo history
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Local data for optimistic updates
  const [localData, setLocalData] = useState(data);

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  // Sync local data with props
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Generate cell key
  const getCellKey = (row: number, col: string) => `${row}-${col}`;

  // Handle cell selection
  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell(null);
  }, []);

  // Handle edit start
  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
  }, []);

  // Handle edit end
  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Handle cell save
  const handleCellSave = useCallback(async (
    rowIndex: number,
    columnCode: string,
    newValue: unknown
  ) => {
    const oldValue = localData[rowIndex]?.[columnCode];
    const cellKey = getCellKey(rowIndex, columnCode);

    // Optimistic update
    setLocalData(prev => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], [columnCode]: newValue };
      return newData;
    });

    // Set saving state
    setCellSaveStates(prev => ({ ...prev, [cellKey]: 'saving' }));

    try {
      await onCellUpdate?.(rowIndex, columnCode, newValue);

      // Add to undo stack
      setUndoStack(prev => [...prev.slice(-19), {
        rowIndex,
        columnCode,
        oldValue,
        newValue,
        timestamp: Date.now(),
      }]);

      // Set saved state
      setCellSaveStates(prev => ({ ...prev, [cellKey]: 'saved' }));

      // Clear saved state after animation
      setTimeout(() => {
        setCellSaveStates(prev => ({ ...prev, [cellKey]: 'idle' }));
      }, 1500);
    } catch (error) {
      // Revert optimistic update
      setLocalData(prev => {
        const newData = [...prev];
        newData[rowIndex] = { ...newData[rowIndex], [columnCode]: oldValue };
        return newData;
      });

      // Set error state
      setCellSaveStates(prev => ({ ...prev, [cellKey]: 'error' }));
    }
  }, [localData, onCellUpdate]);

  // Handle keyboard navigation
  const handleNavigate = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'tab-back') => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1);
        break;
      case 'down':
        newRow = Math.min(localData.length - 1, row + 1);
        break;
      case 'left':
        newCol = Math.max(0, col - 1);
        break;
      case 'right':
        newCol = Math.min(columns.length - 1, col + 1);
        break;
      case 'tab':
        if (col < columns.length - 1) {
          newCol = col + 1;
        } else if (row < localData.length - 1) {
          newRow = row + 1;
          newCol = 0;
        }
        break;
      case 'tab-back':
        if (col > 0) {
          newCol = col - 1;
        } else if (row > 0) {
          newRow = row - 1;
          newCol = columns.length - 1;
        }
        break;
    }

    setSelectedCell({ row: newRow, col: newCol });
    setEditingCell(null);
  }, [selectedCell, localData.length, columns.length]);

  // Handle undo
  const handleUndo = useCallback(async () => {
    const lastAction = undoStack[undoStack.length - 1];
    if (!lastAction) return;

    const { rowIndex, columnCode, oldValue } = lastAction;

    // Optimistic update
    setLocalData(prev => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], [columnCode]: oldValue };
      return newData;
    });

    // Remove from undo stack
    setUndoStack(prev => prev.slice(0, -1));

    // Save to server
    try {
      await onCellUpdate?.(rowIndex, columnCode, oldValue);
    } catch {
      // Revert if failed
      setLocalData(prev => {
        const newData = [...prev];
        newData[rowIndex] = { ...newData[rowIndex], [columnCode]: lastAction.newValue };
        return newData;
      });
      setUndoStack(prev => [...prev, lastAction]);
    }
  }, [undoStack, onCellUpdate]);

  // Handle row selection toggle
  const handleRowSelect = useCallback((rowIndex: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === localData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(localData.map((_, i) => i)));
    }
  }, [selectedRows.size, localData]);

  // Handle delete selected
  const handleDeleteSelected = useCallback(async () => {
    if (selectedRows.size === 0) return;
    await onRowDelete?.(Array.from(selectedRows));
    setSelectedRows(new Set());
  }, [selectedRows, onRowDelete]);

  // Global keyboard handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !editingCell) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell, handleUndo]);

  // Empty state
  if (localData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="font-medium text-lg">No Data</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-md">
          This template has no records yet. Add data through Vendors or Contracts, or click below to add a record.
        </p>
        {onRowAdd && (
          <Button onClick={onRowAdd} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        )}
      </div>
    );
  }

  const allSelected = selectedRows.size === localData.length;
  const someSelected = selectedRows.size > 0;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {someSelected && (
            <>
              <Badge variant="secondary" className="text-xs">
                {selectedRows.size} selected
              </Badge>
              {onRowDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onRowAdd && (
            <Button variant="outline" size="sm" onClick={onRowAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Click</kbd> to select</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Double-click</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> to edit</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Tab</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Arrows</kbd> to navigate</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">Ctrl+Z</kbd> to undo</span>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="relative w-full overflow-auto border rounded-lg"
        role="grid"
        aria-label={`Editable table for template ${templateId}`}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {/* Selection column */}
              <TableHead className="w-12 sticky left-0 bg-muted/50 z-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              {/* Row number column */}
              <TableHead className="w-12 sticky left-12 bg-muted/50 z-10 font-mono text-xs text-center">
                #
              </TableHead>
              {/* Data columns */}
              {columns.map((col) => (
                <TableHead
                  key={col.esaCode}
                  className={cn(
                    'min-w-[150px] whitespace-nowrap',
                    col.required && 'bg-amber-50/50'
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {col.esaCode}
                      </span>
                      {col.required && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-800 border-amber-300"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">{col.description}</span>
                  </div>
                </TableHead>
              ))}
              {/* Actions column */}
              <TableHead className="w-12 sticky right-0 bg-muted/50 z-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {localData.map((row, rowIndex) => {
              const rowErrors = validationErrors?.get(rowIndex);
              const isRowSelected = selectedRows.has(rowIndex);

              return (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    'group',
                    rowErrors && rowErrors.size > 0 && 'bg-red-50/30',
                    isRowSelected && 'bg-primary/5'
                  )}
                >
                  {/* Selection cell */}
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={isRowSelected}
                      onCheckedChange={() => handleRowSelect(rowIndex)}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </TableCell>
                  {/* Row number */}
                  <TableCell className="sticky left-12 bg-background z-10 font-mono text-xs text-center text-muted-foreground">
                    {rowIndex + 1}
                  </TableCell>
                  {/* Data cells */}
                  {columns.map((col, colIndex) => {
                    const value = row[col.esaCode];
                    const hasError = rowErrors?.has(col.esaCode);
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const cellKey = getCellKey(rowIndex, col.esaCode);

                    return (
                      <TableCell
                        key={col.esaCode}
                        className={cn(
                          'p-0',
                          col.required && 'bg-amber-50/20'
                        )}
                      >
                        <EditableCell
                          value={value}
                          dataType={col.dataType}
                          enumeration={col.enumeration}
                          required={col.required}
                          hasError={hasError}
                          isSelected={isSelected}
                          isEditing={isEditing}
                          rowIndex={rowIndex}
                          columnCode={col.esaCode}
                          onSelect={() => handleCellSelect(rowIndex, colIndex)}
                          onStartEdit={() => handleStartEdit(rowIndex, colIndex)}
                          onEndEdit={handleEndEdit}
                          onSave={(newValue) => handleCellSave(rowIndex, col.esaCode, newValue)}
                          onNavigate={handleNavigate}
                          saveStatus={cellSaveStates[cellKey] || 'idle'}
                        />
                      </TableCell>
                    );
                  })}
                  {/* Row actions */}
                  <TableCell className="sticky right-0 bg-background z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          // Copy row to clipboard as JSON
                          navigator.clipboard.writeText(JSON.stringify(row, null, 2));
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Row
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onRowDelete && (
                          <DropdownMenuItem
                            onClick={() => onRowDelete([rowIndex])}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Row
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{localData.length} records</span>
        {undoStack.length > 0 && (
          <span>{undoStack.length} change{undoStack.length !== 1 ? 's' : ''} can be undone</span>
        )}
      </div>
    </div>
  );
}
