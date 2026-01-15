'use client';

import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { type ColumnMapping } from '@/lib/roi/mappings';
import { getRecordSummary } from '@/hooks/use-data-entry-sheet';

interface RecordListViewProps {
  records: Record<string, unknown>[];
  fields: ColumnMapping[];
  primaryFields: ColumnMapping[];
  currentIndex: number;
  selectedRecords: Set<number>;
  onNavigate: (index: number) => void;
  onToggleSelection: (index: number) => void;
  onClearSelection: () => void;
}

export function RecordListView({
  records,
  fields,
  primaryFields,
  currentIndex,
  selectedRecords,
  onNavigate,
  onToggleSelection,
  onClearSelection,
}: RecordListViewProps) {
  return (
    <div className="p-4">
      <div className="space-y-2">
        {records.map((record, index) => (
          <button
            key={index}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-colors',
              'hover:bg-muted/50 hover:border-primary/30',
              currentIndex === index && 'bg-primary/5 border-primary/50',
              selectedRecords.has(index) && 'ring-2 ring-primary/30'
            )}
            onClick={() => onNavigate(index)}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedRecords.has(index)}
                onCheckedChange={() => onToggleSelection(index)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {getRecordSummary(record, fields)}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {primaryFields.slice(0, 3).map((field) => (
                    <span
                      key={field.esaCode}
                      className="text-xs text-muted-foreground truncate"
                    >
                      <span className="font-mono opacity-60">{field.esaCode}:</span>{' '}
                      {(record[field.esaCode] as string)?.substring(0, 20) || '-'}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedRecords.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedRecords.size} selected
          </span>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="outline">
            Export Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
