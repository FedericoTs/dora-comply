'use client';

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SerializableColumn } from './types';

interface TableHeaderRowProps {
  columns: SerializableColumn[];
  allSelected: boolean;
  onSelectAll: () => void;
}

export function TableHeaderRow({ columns, allSelected, onSelectAll }: TableHeaderRowProps) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        {/* Selection column */}
        <TableHead className="w-12 sticky left-0 bg-muted/50 z-10">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
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
                {col.dbColumn === '_computed' && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/30"
                  >
                    Computed
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
  );
}
