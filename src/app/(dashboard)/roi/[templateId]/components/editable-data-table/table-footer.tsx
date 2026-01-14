'use client';

interface TableFooterProps {
  recordCount: number;
  undoCount: number;
}

export function TableFooter({ recordCount, undoCount }: TableFooterProps) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>{recordCount} records</span>
      {undoCount > 0 && (
        <span>{undoCount} change{undoCount !== 1 ? 's' : ''} can be undone</span>
      )}
    </div>
  );
}
