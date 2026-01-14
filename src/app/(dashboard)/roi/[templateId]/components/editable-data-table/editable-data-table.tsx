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

import { useRef } from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { AddRowZone } from '../add-row-zone';
import { useEditableTable } from './use-editable-table';
import { EmptyState } from './empty-state';
import { TableToolbar } from './table-toolbar';
import { KeyboardHints } from './keyboard-hints';
import { TableHeaderRow } from './table-header-row';
import { DataRow } from './data-row';
import { TableFooter } from './table-footer';
import type { EditableDataTableProps } from './types';

export function EditableDataTable({
  templateId,
  data,
  columns,
  validationErrors,
  onCellUpdate,
  onRowAdd,
  onRowDelete,
  newRowIndex,
  isLoading,
}: EditableDataTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  const {
    localData,
    selectedCell,
    editingCell,
    selectedRows,
    cellSaveStates,
    undoStack,
    allSelected,
    someSelected,
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
  } = useEditableTable({
    data,
    columns,
    onCellUpdate,
    onRowAdd,
    onRowDelete,
    isLoading,
  });

  // Empty state
  if (localData.length === 0) {
    return <EmptyState onRowAdd={onRowAdd} />;
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <TableToolbar
        selectedCount={selectedRows.size}
        undoCount={undoStack.length}
        canDelete={!!onRowDelete}
        canAddRow={!!onRowAdd}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndo}
        onAddRow={onRowAdd}
      />

      {/* Keyboard hint */}
      <KeyboardHints />

      {/* Table */}
      <div
        ref={tableRef}
        className="relative w-full overflow-auto border rounded-lg"
        role="grid"
        aria-label={`Editable table for template ${templateId}`}
      >
        <Table>
          <TableHeaderRow
            columns={columns}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
          />
          <TableBody>
            {localData.map((row, rowIndex) => (
              <DataRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                validationErrors={validationErrors?.get(rowIndex)}
                isSelected={selectedRows.has(rowIndex)}
                isNewRow={newRowIndex === rowIndex}
                selectedCell={selectedCell}
                editingCell={editingCell}
                cellSaveStates={cellSaveStates}
                onRowSelect={handleRowSelect}
                onCellSelect={handleCellSelect}
                onStartEdit={handleStartEdit}
                onEndEdit={handleEndEdit}
                onCellSave={handleCellSave}
                onNavigate={handleNavigate}
                onRowDelete={onRowDelete}
                getCellKey={getCellKey}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Row Zone */}
      {onRowAdd && (
        <AddRowZone
          onAddRow={onRowAdd}
          disabled={isLoading}
          className="mt-2"
        />
      )}

      {/* Footer stats */}
      <TableFooter recordCount={localData.length} undoCount={undoStack.length} />
    </div>
  );
}
