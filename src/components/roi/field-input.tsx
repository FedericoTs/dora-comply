'use client';

import { Search, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EBA_COUNTRY_CODES, type ColumnMapping } from '@/lib/roi/mappings';
import { getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';
import type { FieldValue } from '@/hooks/use-data-entry-sheet';

interface FieldInputProps {
  field: ColumnMapping;
  value?: FieldValue;
  onChange: (value: string) => void;
  onLeiSearch?: (query: string) => void;
  showLeiSuggestions?: boolean;
  leiSuggestions?: GLEIFEntity[];
  leiSearching?: boolean;
  onSelectLei?: (entity: GLEIFEntity) => void;
}

export function FieldInput({
  field,
  value,
  onChange,
  onLeiSearch,
  showLeiSuggestions,
  leiSuggestions = [],
  leiSearching,
  onSelectLei,
}: FieldInputProps) {
  const hasError = value && !value.isValid && value.value;
  const isLeiField = field.esaCode === 'c0010' || field.description.toLowerCase().includes('lei');

  // Get enumeration options
  const getEnumOptions = (): { value: string; label: string }[] => {
    if (!field.enumeration) return [];

    if (field.enumeration === EBA_COUNTRY_CODES) {
      return Object.entries(field.enumeration).map(([code, ebaValue]) => ({
        value: ebaValue,
        label: `${getCountryFlag(code)} ${code}`,
      }));
    }

    return Object.entries(field.enumeration).map(([key, ebaValue]) => ({
      value: ebaValue,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={field.esaCode}
          className={cn(
            'flex items-center gap-1.5 text-sm',
            hasError && 'text-destructive'
          )}
        >
          <span className="font-mono text-xs text-muted-foreground">
            {field.esaCode}
          </span>
          <span>{field.description}</span>
          {field.required && <span className="text-destructive">*</span>}
          {value?.isAiPopulated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Sparkles className="h-3 w-3 text-primary" />
                </TooltipTrigger>
                <TooltipContent>Auto-populated from document</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        {value?.isValid && value.value && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {hasError && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>{value?.error}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Enum field (select) */}
      {field.dataType === 'enum' && field.enumeration ? (
        <Select value={value?.value || ''} onValueChange={onChange}>
          <SelectTrigger
            id={field.esaCode}
            className={cn(hasError && 'border-destructive')}
          >
            <SelectValue placeholder={`Select ${field.description.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {getEnumOptions().map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.dataType === 'boolean' ? (
        <Select
          value={value?.value === 'true' ? 'true' : value?.value === 'false' ? 'false' : ''}
          onValueChange={onChange}
        >
          <SelectTrigger
            id={field.esaCode}
            className={cn(hasError && 'border-destructive')}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      ) : isLeiField ? (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              id={field.esaCode}
              type="text"
              value={value?.value || ''}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              placeholder="20-character LEI or search by name"
              maxLength={20}
              className={cn(
                'flex-1 font-mono uppercase',
                hasError && 'border-destructive',
                value?.isAiPopulated && 'bg-primary/5 border-primary/20'
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onLeiSearch?.(value?.value || '')}
              disabled={leiSearching || !value?.value || value.value.length < 3}
            >
              {leiSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* LEI Suggestions */}
          {showLeiSuggestions && leiSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg">
              <div className="p-1">
                {leiSuggestions.map((entity) => (
                  <button
                    key={entity.lei}
                    type="button"
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => onSelectLei?.(entity)}
                  >
                    <p className="font-medium text-sm">{entity.legalName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>
                        {getCountryFlag(entity.legalAddress.country)}{' '}
                        {entity.legalAddress.country}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{entity.lei}</span>
                      {entity.registrationStatus === 'ISSUED' && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-200 h-4 text-[10px]"
                          >
                            Active
                          </Badge>
                        </>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Input
          id={field.esaCode}
          type={field.dataType === 'date' ? 'date' : field.dataType === 'number' ? 'number' : 'text'}
          value={value?.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.description.toLowerCase()}`}
          className={cn(
            hasError && 'border-destructive',
            value?.isAiPopulated && 'bg-primary/5 border-primary/20'
          )}
        />
      )}

      {hasError && value?.error && (
        <p className="text-xs text-destructive">{value.error}</p>
      )}
    </div>
  );
}
