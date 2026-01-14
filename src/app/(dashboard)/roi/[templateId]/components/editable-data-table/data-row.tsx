'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EditableCell } from '../editable-cell';
import { RowActions } from './row-actions';
import type { SerializableColumn, CellPosition, CellSaveState, NavigationDirection } from './types';

interface DataRowProps {
  row: Record<string, unknown>;
  rowIndex: number;
  columns: SerializableColumn[];
  validationErrors?: Set<string>;
  isSelected: boolean;
  isNewRow: boolean;
  selectedCell: CellPosition | null;
  editingCell: CellPosition | null;
  cellSaveStates: CellSaveState;
  onRowSelect: (rowIndex: number) => void;
  onCellSelect: (row: number, col: number) => void;
  onStartEdit: (row: number, col: number) => void;
  onEndEdit: () => void;
  onCellSave: (rowIndex: number, columnCode: string, value: unknown) => Promise<void>;
  onNavigate: (direction: NavigationDirection) => void;
  onRowDelete?: (rowIndices: number[]) => Promise<void>;
  getCellKey: (row: number, col: string) => string;
}

export function DataRow({
  row,
  rowIndex,
  columns,
  validationErrors,
  isSelected,
  isNewRow,
  selectedCell,
  editingCell,
  cellSaveStates,
  onRowSelect,
  onCellSelect,
  onStartEdit,
  onEndEdit,
  onCellSave,
  onNavigate,
  onRowDelete,
  getCellKey,
}: DataRowProps) {
  const hasErrors = validationErrors && validationErrors.size > 0;

  return (
    <TableRow
      className={cn(
        'group transition-colors',
        hasErrors && 'bg-red-50/30',
        isSelected && 'bg-primary/5',
        isNewRow && 'bg-green-50 animate-pulse'
      )}
    >
      {/* Selection cell */}
      <TableCell className="sticky left-0 bg-background z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onRowSelect(rowIndex)}
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
        const hasError = validationErrors?.has(col.esaCode);
        const isCellSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
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
              isSelected={isCellSelected}
              isEditing={isEditing}
              readOnly={col.dbColumn === '_computed'}
              rowIndex={rowIndex}
              columnCode={col.esaCode}
              onSelect={() => onCellSelect(rowIndex, colIndex)}
              onStartEdit={() => onStartEdit(rowIndex, colIndex)}
              onEndEdit={onEndEdit}
              onSave={(newValue) => onCellSave(rowIndex, col.esaCode, newValue)}
              onNavigate={onNavigate}
              saveStatus={cellSaveStates[cellKey] || 'idle'}
            />
          </TableCell>
        );
      })}
      {/* Row actions */}
      <TableCell className="sticky right-0 bg-background z-10">
        <RowActions row={row} rowIndex={rowIndex} onDelete={onRowDelete} />
      </TableCell>
    </TableRow>
  );
}
