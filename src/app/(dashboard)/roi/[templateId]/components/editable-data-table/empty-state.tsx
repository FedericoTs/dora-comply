'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onRowAdd?: () => Promise<void>;
}

export function EmptyState({ onRowAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
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
        This template has no records yet. Add data through Vendors or Contracts, or click below to add a record.
      </p>
      {onRowAdd && (
        <Button onClick={onRowAdd} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      )}
    </div>
  );
}
