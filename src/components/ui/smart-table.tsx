'use client';

import { useState, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { StatusDot, type GeneralStatus as StatusLevel } from './status-badge';
import { TrendArrow } from './trend-indicator';
import { ProgressMini } from './progress-mini';
import { GradeIndicator, type Grade } from './grade-badge';
import { TierIndicator, type VendorTier } from './tier-badge';

// ============================================================================
// Types
// ============================================================================

export type IndicatorType = 'status' | 'trend' | 'progress' | 'grade' | 'tier';

export interface SmartTableAction<T> {
  icon: LucideIcon;
  label: string;
  href?: (row: T) => string;
  onClick?: (row: T) => void;
  variant?: 'default' | 'destructive';
}

export interface SmartTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;

  // Indicator configuration
  indicator?: {
    type: IndicatorType;
    field?: keyof T;
    // Additional options per indicator type
    invertTrend?: boolean; // For trend arrows
    showValue?: boolean; // For various indicators
  };

  // Secondary line (subtitle)
  subtitle?: keyof T;

  // Custom render function
  render?: (row: T) => ReactNode;

  // Sorting
  sortable?: boolean;

  // Alignment
  align?: 'left' | 'center' | 'right';
}

export interface SmartTableProps<T> {
  data: T[];
  columns: SmartTableColumn<T>[];
  keyField: keyof T;

  // Selection
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;

  // Actions column
  actions?: SmartTableAction<T>[];

  // Row click
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;

  // Empty state
  emptyMessage?: string;

  // Loading state
  loading?: boolean;

  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function renderIndicator<T>(
  row: T,
  indicator: NonNullable<SmartTableColumn<T>['indicator']>,
  column: SmartTableColumn<T>
) {
  const field = indicator.field || (column.key as keyof T);
  const value = row[field];

  switch (indicator.type) {
    case 'status':
      return (
        <StatusDot
          status={value as StatusLevel}
          showLabel
          size="sm"
        />
      );

    case 'trend':
      return (
        <TrendArrow
          value={value as number}
          size="sm"
          invertColors={indicator.invertTrend}
          showValue={indicator.showValue !== false}
        />
      );

    case 'progress':
      return (
        <ProgressMini
          value={value as number}
          size="sm"
          showValue={indicator.showValue !== false}
        />
      );

    case 'grade':
      return (
        <GradeIndicator
          grade={value as Grade}
          size="sm"
        />
      );

    case 'tier':
      return (
        <TierIndicator
          tier={value as VendorTier}
        />
      );

    default:
      return String(value);
  }
}

function CellContent<T>({
  row,
  column,
}: {
  row: T;
  column: SmartTableColumn<T>;
}) {
  // Custom render
  if (column.render) {
    return <>{column.render(row)}</>;
  }

  const value = row[column.key as keyof T];
  const hasIndicator = !!column.indicator;
  const hasSubtitle = !!column.subtitle;

  const mainContent = hasIndicator
    ? renderIndicator(row, column.indicator!, column)
    : String(value ?? '');

  if (!hasSubtitle) {
    return <>{mainContent}</>;
  }

  const subtitleValue = row[column.subtitle!];

  return (
    <div className="flex flex-col">
      <span>{mainContent}</span>
      <span className="text-xs text-muted-foreground">{String(subtitleValue ?? '')}</span>
    </div>
  );
}

function ActionsCell<T>({
  row,
  actions,
}: {
  row: T;
  actions: SmartTableAction<T>[];
}) {
  // Show first 2 actions as icons, rest in dropdown
  const visibleActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <div className="flex items-center justify-end gap-1">
      {visibleActions.map((action, index) => {
        const Icon = action.icon;
        const content = (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick?.(row);
            }}
            title={action.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );

        if (action.href) {
          return (
            <Link key={index} href={action.href(row)} onClick={(e) => e.stopPropagation()}>
              {content}
            </Link>
          );
        }

        return content;
      })}

      {overflowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflowActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick?.(row);
                  }}
                  className={cn(action.variant === 'destructive' && 'text-destructive')}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SmartTable<T>({
  data,
  columns,
  keyField,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  actions,
  onRowClick,
  rowHref,
  emptyMessage = 'No data found',
  loading = false,
  className,
}: SmartTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn as keyof T];
      const bVal = b[sortColumn as keyof T];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Selection helpers
  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      const allKeys = new Set(data.map((row) => row[keyField] as string | number));
      onSelectionChange?.(allKeys);
    }
  };

  const handleSelectRow = (row: T) => {
    const key = row[keyField] as string | number;
    const newSelection = new Set(selectedKeys);

    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }

    onSelectionChange?.(newSelection);
  };

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  column.width,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer select-none hover:bg-muted/50'
                )}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortColumn === String(column.key) && (
                    sortDirection === 'asc'
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
            ))}
            {actions && actions.length > 0 && (
              <TableHead className="w-24 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                className="h-24 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Loading...
                </div>
              </TableCell>
            </TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row) => {
              const key = row[keyField] as string | number;
              const isSelected = selectedKeys.has(key);

              const rowContent = (
                <TableRow
                  key={key}
                  className={cn(
                    isSelected && 'bg-primary/5',
                    (onRowClick || rowHref) && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(row)}
                        aria-label={`Select row ${key}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={cn(
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      <CellContent row={row} column={column} />
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell>
                      <ActionsCell row={row} actions={actions} />
                    </TableCell>
                  )}
                </TableRow>
              );

              if (rowHref) {
                return (
                  <Link key={key} href={rowHref(row)} className="contents">
                    {rowContent}
                  </Link>
                );
              }

              return rowContent;
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
