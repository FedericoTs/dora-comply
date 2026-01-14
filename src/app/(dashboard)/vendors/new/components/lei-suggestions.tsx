'use client';

import { getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

interface LeiSuggestionsProps {
  suggestions: GLEIFEntity[];
  onSelect: (entity: GLEIFEntity) => void;
}

export function LeiSuggestions({ suggestions, onSelect }: LeiSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
      <p className="text-sm font-medium">Matching entities:</p>
      {suggestions.map((entity) => (
        <button
          key={entity.lei}
          type="button"
          className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
          onClick={() => onSelect(entity)}
        >
          <p className="font-medium text-sm">{entity.legalName}</p>
          <p className="text-xs text-muted-foreground">
            {getCountryFlag(entity.legalAddress.country)}{' '}
            {entity.legalAddress.country} • LEI: {entity.lei}
          </p>
        </button>
      ))}
    </div>
  );
}
