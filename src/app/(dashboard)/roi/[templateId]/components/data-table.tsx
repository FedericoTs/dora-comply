'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: SerializableColumn[];
  validationErrors?: Map<number, Set<string>>;
}

export function DataTable({ data, columns, validationErrors }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
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
          This template has no records. Add data through the Vendors or Contracts sections, and it will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 sticky left-0 bg-background">#</TableHead>
            {columns.map((col) => (
              <TableHead
                key={col.esaCode}
                className={cn(
                  "min-w-[150px] whitespace-nowrap",
                  col.required && "bg-amber-50/50"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {col.esaCode}
                    </span>
                    {col.required && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-800 border-amber-300">
                        Required
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">{col.description}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => {
            const rowErrors = validationErrors?.get(rowIndex);

            return (
              <TableRow
                key={rowIndex}
                className={cn(rowErrors && rowErrors.size > 0 && 'bg-red-50/50')}
              >
                <TableCell className="font-mono text-xs sticky left-0 bg-background">
                  {rowIndex + 1}
                </TableCell>
                {columns.map((col) => {
                  // Data is keyed by ESA codes (c0010, c0020, etc.), not dbColumn names
                  const value = row[col.esaCode];
                  const hasError = rowErrors?.has(col.esaCode);
                  const isEmpty = value === null || value === undefined || value === '';
                  const isMissingRequired = col.required && isEmpty;

                  return (
                    <TableCell
                      key={col.esaCode}
                      className={cn(
                        'whitespace-nowrap',
                        hasError && 'bg-red-100 border-red-200',
                        isMissingRequired && !hasError && 'bg-amber-50'
                      )}
                    >
                      <CellValue
                        value={value}
                        type={col.dataType}
                        hasError={hasError}
                        required={col.required}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface CellValueProps {
  value: unknown;
  type: string;
  hasError?: boolean;
  required?: boolean;
}

function CellValue({ value, type, hasError, required }: CellValueProps) {
  if (value === null || value === undefined || value === '') {
    // Show different indicator for required vs optional empty fields
    if (required) {
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

  switch (type) {
    case 'date':
      return (
        <span className="font-mono text-sm">
          {formatDate(stringValue)}
        </span>
      );

    case 'boolean':
      return (
        <Badge variant={stringValue === 'true' ? 'default' : 'secondary'}>
          {stringValue === 'true' ? 'Yes' : 'No'}
        </Badge>
      );

    case 'enum':
      return (
        <Badge variant="outline" className="font-mono text-xs">
          {stringValue}
        </Badge>
      );

    case 'number':
      return (
        <span className="font-mono text-sm">
          {formatNumber(value)}
        </span>
      );

    default:
      return (
        <span className={cn('text-sm', stringValue.length > 50 && 'truncate max-w-[200px] block')}>
          {stringValue}
        </span>
      );
  }
}

function formatDate(value: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
  } catch {
    return value;
  }
}

function formatNumber(value: unknown): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  const num = parseFloat(String(value));
  return isNaN(num) ? String(value) : num.toLocaleString();
}
