'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/lib/vendors/types';

interface VendorViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function VendorViewToggle({ value, onChange }: VendorViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border bg-muted p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 px-2.5 gap-1.5',
          value === 'cards' && 'bg-background shadow-sm'
        )}
        onClick={() => onChange('cards')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 px-2.5 gap-1.5',
          value === 'table' && 'bg-background shadow-sm'
        )}
        onClick={() => onChange('table')}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  );
}
