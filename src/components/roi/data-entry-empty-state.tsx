'use client';

import { Plus } from 'lucide-react';
import { type ColumnMapping } from '@/lib/roi/mappings';
import type { GLEIFEntity } from '@/lib/vendors/types';
import type { FieldValue } from '@/hooks/use-data-entry-sheet';
import { FieldInput } from './field-input';

interface DataEntryEmptyStateProps {
  fields: ColumnMapping[];
  values: Record<string, FieldValue>;
  leiSearchField: string | null;
  leiSuggestions: GLEIFEntity[];
  leiSearching: boolean;
  onValueChange: (fieldCode: string, value: string) => void;
  onLeiSearch: (fieldCode: string, query: string) => void;
  onSelectLei: (entity: GLEIFEntity) => void;
}

export function DataEntryEmptyState({
  fields,
  values,
  leiSearchField,
  leiSuggestions,
  leiSearching,
  onValueChange,
  onLeiSearch,
  onSelectLei,
}: DataEntryEmptyStateProps) {
  return (
    <div className="p-6">
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <Plus className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <h4 className="font-medium mb-1">No records yet</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add your first record to get started
        </p>
        <div className="space-y-4">
          {fields.slice(0, 5).map((field) => (
            <FieldInput
              key={field.esaCode}
              field={field}
              value={values[field.esaCode]}
              onChange={(v) => onValueChange(field.esaCode, v)}
              onLeiSearch={(q) => onLeiSearch(field.esaCode, q)}
              showLeiSuggestions={
                leiSearchField === field.esaCode && leiSuggestions.length > 0
              }
              leiSuggestions={leiSuggestions}
              leiSearching={leiSearching && leiSearchField === field.esaCode}
              onSelectLei={onSelectLei}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
