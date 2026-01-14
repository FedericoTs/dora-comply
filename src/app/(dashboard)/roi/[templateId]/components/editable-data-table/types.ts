import type { CellSaveStatus } from '../editable-cell';
import type { RoiTemplateId } from '@/lib/roi/types';

export interface SerializableColumn {
  esaCode: string;
  dbColumn: string;
  dbTable: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  enumeration?: Record<string, string>;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellSaveState {
  [key: string]: CellSaveStatus; // key: `${rowIndex}-${colCode}`
}

export interface UndoAction {
  rowIndex: number;
  columnCode: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface EditableDataTableProps {
  templateId: RoiTemplateId;
  data: Record<string, unknown>[];
  columns: SerializableColumn[];
  validationErrors?: Map<number, Set<string>>;
  onCellUpdate?: (rowIndex: number, columnCode: string, value: unknown) => Promise<void>;
  onRowAdd?: () => Promise<void>;
  onRowDelete?: (rowIndices: number[]) => Promise<void>;
  newRowIndex?: number | null;
  isLoading?: boolean;
}

export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'tab' | 'tab-back';

export type { CellSaveStatus, RoiTemplateId };
