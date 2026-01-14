'use client';

import { ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type ColumnMapping } from '@/lib/roi/mappings';
import { getRecordSummary, getRecordIdentifier } from '@/hooks/use-data-entry-sheet';

interface RecordNavigatorProps {
  records: Record<string, unknown>[];
  fields: ColumnMapping[];
  currentIndex: number;
  currentRecord: Record<string, unknown> | undefined;
  recordPickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

export function RecordNavigator({
  records,
  fields,
  currentIndex,
  currentRecord,
  recordPickerOpen,
  onPickerOpenChange,
  onNavigate,
}: RecordNavigatorProps) {
  return (
    <div className="flex items-center justify-between pt-3 gap-2">
      {/* Record Picker */}
      <Popover open={recordPickerOpen} onOpenChange={onPickerOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={recordPickerOpen}
            className="justify-between min-w-[200px] h-9"
          >
            <span className="truncate text-sm">
              {currentRecord ? getRecordSummary(currentRecord, fields) : 'Select record'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search records..." />
            <CommandList>
              <CommandEmpty>No records found.</CommandEmpty>
              <CommandGroup>
                {records.map((record, index) => (
                  <CommandItem
                    key={index}
                    value={`${index}-${getRecordSummary(record, fields)}`}
                    onSelect={() => {
                      onNavigate(index);
                      onPickerOpenChange(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        currentIndex === index ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getRecordSummary(record, fields)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {getRecordIdentifier(record)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      #{index + 1}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Prev/Next Navigation */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground px-2">
          {currentIndex + 1} / {records.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex >= records.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
