'use client';

import { Plus, Trash2, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TableToolbarProps {
  selectedCount: number;
  undoCount: number;
  canDelete: boolean;
  canAddRow: boolean;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onAddRow?: () => void;
}

export function TableToolbar({
  selectedCount,
  undoCount,
  canDelete,
  canAddRow,
  onDeleteSelected,
  onUndo,
  onAddRow,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteSelected}
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
                onClick={onUndo}
                disabled={undoCount === 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {canAddRow && onAddRow && (
          <Button variant="outline" size="sm" onClick={onAddRow}>
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        )}
      </div>
    </div>
  );
}
