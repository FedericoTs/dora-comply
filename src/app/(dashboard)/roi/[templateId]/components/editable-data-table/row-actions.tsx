'use client';

import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RowActionsProps {
  row: Record<string, unknown>;
  rowIndex: number;
  onDelete?: (rowIndices: number[]) => Promise<void>;
}

export function RowActions({ row, rowIndex, onDelete }: RowActionsProps) {
  const handleCopyRow = () => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
  };

  return (
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
        <DropdownMenuItem onClick={handleCopyRow}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete([rowIndex])}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Row
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
