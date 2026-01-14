'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  CellPosition,
  CellSaveState,
  UndoAction,
  NavigationDirection,
  SerializableColumn,
} from './types';

interface UseEditableTableProps {
  data: Record<string, unknown>[];
  columns: SerializableColumn[];
  onCellUpdate?: (rowIndex: number, columnCode: string, value: unknown) => Promise<void>;
  onRowAdd?: () => Promise<void>;
  onRowDelete?: (rowIndices: number[]) => Promise<void>;
  isLoading?: boolean;
}

export function useEditableTable({
  data,
  columns,
  onCellUpdate,
  onRowAdd,
  onRowDelete,
  isLoading,
}: UseEditableTableProps) {
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
  const handleNavigate = useCallback((direction: NavigationDirection) => {
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
      // Don't handle when editing a cell
      if (editingCell) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Add Row: Ctrl+Enter / Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onRowAdd && !isLoading) {
        e.preventDefault();
        onRowAdd();
        return;
      }

      // Delete selected rows: Backspace (when rows are selected, not editing)
      if (e.key === 'Backspace' && selectedRows.size > 0 && onRowDelete) {
        e.preventDefault();
        onRowDelete(Array.from(selectedRows));
        setSelectedRows(new Set());
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell, handleUndo, onRowAdd, onRowDelete, selectedRows, isLoading]);

  return {
    // State
    localData,
    selectedCell,
    editingCell,
    selectedRows,
    cellSaveStates,
    undoStack,

    // Derived
    allSelected: selectedRows.size === localData.length,
    someSelected: selectedRows.size > 0,

    // Handlers
    getCellKey,
    handleCellSelect,
    handleStartEdit,
    handleEndEdit,
    handleCellSave,
    handleNavigate,
    handleUndo,
    handleRowSelect,
    handleSelectAll,
    handleDeleteSelected,
  };
}
