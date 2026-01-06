'use client';

/**
 * Data Entry Sheet
 *
 * Slide-out panel for editing RoI template records
 * - Loads real data from API
 * - Supports all 14 templates via TEMPLATE_MAPPINGS
 * - Has record navigation (prev/next)
 * - LEI search for LEI fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Search,
  Plus,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_MAPPINGS,
  getColumnOrder,
  EBA_COUNTRY_CODES,
  EBA_ENTITY_TYPES,
  EBA_CONTRACT_TYPES,
  EBA_SERVICE_TYPES,
  EBA_SENSITIVENESS,
  EBA_IMPACT_LEVELS,
  EBA_CRITICALITY,
  EBA_SUBSTITUTABILITY,
  EBA_REINTEGRATION,
  EBA_CODE_TYPES,
  EBA_ENTITY_NATURE,
  EBA_PERSON_TYPES,
  ISO_CURRENCY_CODES,
  type ColumnMapping,
} from '@/lib/roi/mappings';
import { ROI_TEMPLATES, type RoiTemplateId, type TemplateWithStatus } from '@/lib/roi/types';
import { searchEntities, validateLEI, getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

interface DataEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateWithStatus | null;
  onSave?: () => void;
}

interface FieldValue {
  value: string;
  isValid: boolean;
  error?: string;
  isAiPopulated?: boolean;
}

// Get human-readable label for enum values
function getEnumLabel(enumeration: Record<string, string> | undefined, value: string): string {
  if (!enumeration) return value;
  const entry = Object.entries(enumeration).find(([, v]) => v === value);
  return entry ? formatEnumKey(entry[0]) : value;
}

function formatEnumKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Get country flag + code for display
function formatCountryOption(code: string): string {
  const flag = getCountryFlag(code);
  return `${flag} ${code}`;
}

export function DataEntrySheet({
  open,
  onOpenChange,
  template,
  onSave,
}: DataEntrySheetProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // LEI search state
  const [leiSearchField, setLeiSearchField] = useState<string | null>(null);
  const [leiSearchQuery, setLeiSearchQuery] = useState('');
  const [leiSearching, setLeiSearching] = useState(false);
  const [leiSuggestions, setLeiSuggestions] = useState<GLEIFEntity[]>([]);

  // Get field definitions from mappings
  const fields = useMemo(() => {
    if (!template) return [];
    const templateKey = template.templateId as RoiTemplateId;
    const mapping = TEMPLATE_MAPPINGS[templateKey];
    if (!mapping) return [];

    const columnOrder = getColumnOrder(templateKey);
    return columnOrder
      .map((code) => mapping[code])
      .filter((f): f is ColumnMapping => f !== undefined);
  }, [template]);

  // Load data when template changes
  useEffect(() => {
    if (!template || !open) return;

    const currentTemplate = template; // Capture for closure

    async function loadData() {
      setIsLoading(true);
      try {
        // Convert B_01.01 to b_01_01 for URL
        const urlId = currentTemplate.templateId.toLowerCase().replace('.', '_');
        const response = await fetch(`/api/roi/${urlId}`);
        if (response.ok) {
          const result = await response.json();
          // API returns { success: true, data: { rows: [...], ... } }
          const data = result.data?.rows || [];
          setRecords(data);
          setCurrentIndex(0);

          // Initialize values from first record
          if (data.length > 0) {
            initializeValues(data[0]);
          } else {
            // Empty template - initialize with empty values
            initializeEmptyValues();
          }
        }
      } catch (error) {
        console.error('Failed to load template data:', error);
        initializeEmptyValues();
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [template, open]);

  const initializeValues = useCallback(
    (record: Record<string, unknown>) => {
      const newValues: Record<string, FieldValue> = {};
      fields.forEach((field) => {
        const value = record[field.esaCode];
        const strValue = value?.toString() || '';
        newValues[field.esaCode] = {
          value: strValue,
          isValid: !field.required || strValue.length > 0,
        };
      });
      setValues(newValues);
      setHasChanges(false);
    },
    [fields]
  );

  const initializeEmptyValues = useCallback(() => {
    const newValues: Record<string, FieldValue> = {};
    fields.forEach((field) => {
      newValues[field.esaCode] = {
        value: '',
        isValid: !field.required,
      };
    });
    setValues(newValues);
    setHasChanges(false);
  }, [fields]);

  // Navigate between records
  const handlePrevRecord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      initializeValues(records[currentIndex - 1]);
    }
  };

  const handleNextRecord = () => {
    if (currentIndex < records.length - 1) {
      setCurrentIndex(currentIndex + 1);
      initializeValues(records[currentIndex + 1]);
    }
  };

  const handleValueChange = useCallback(
    (fieldCode: string, newValue: string) => {
      const field = fields.find((f) => f.esaCode === fieldCode);
      if (!field) return;

      const isValid = !field.required || newValue.length > 0;
      const error = !isValid ? 'This field is required' : undefined;

      setValues((prev) => ({
        ...prev,
        [fieldCode]: { value: newValue, isValid, error },
      }));
      setHasChanges(true);
    },
    [fields]
  );

  // LEI search
  const handleLeiSearch = useCallback(async (fieldCode: string, query: string) => {
    if (query.length < 3) return;

    setLeiSearchField(fieldCode);
    setLeiSearchQuery(query);
    setLeiSearching(true);
    setLeiSuggestions([]);

    try {
      // Check if it's a 20-char LEI
      if (query.length === 20 && /^[A-Z0-9]+$/.test(query)) {
        const result = await validateLEI(query);
        if (result.valid && result.entity) {
          setLeiSuggestions([result.entity]);
        }
      } else {
        // Search by name
        const result = await searchEntities(query, 5);
        setLeiSuggestions(result.results);
      }
    } catch (error) {
      console.error('LEI search error:', error);
    } finally {
      setLeiSearching(false);
    }
  }, []);

  const handleSelectLei = useCallback(
    (entity: GLEIFEntity) => {
      if (!leiSearchField) return;

      // Set the LEI value
      handleValueChange(leiSearchField, entity.lei);

      // Try to auto-fill related fields
      const nameFields = ['c0020', 'c0050']; // Common name field codes
      const countryFields = ['c0030', 'c0080']; // Common country field codes

      nameFields.forEach((code) => {
        if (values[code] !== undefined && !values[code].value) {
          handleValueChange(code, entity.legalName);
        }
      });

      countryFields.forEach((code) => {
        if (values[code] !== undefined && !values[code].value) {
          handleValueChange(code, entity.legalAddress.country);
        }
      });

      // Clear search
      setLeiSearchField(null);
      setLeiSuggestions([]);
    },
    [leiSearchField, values, handleValueChange]
  );

  const handleSave = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      // Build record from values
      const record: Record<string, unknown> = {};
      Object.entries(values).forEach(([code, fieldValue]) => {
        record[code] = fieldValue.value;
      });

      // Convert B_01.01 to b_01_01 for URL
      const urlId = template.templateId.toLowerCase().replace('.', '_');
      const response = await fetch(`/api/roi/${urlId}`, {
        method: records.length > 0 ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record, index: currentIndex }),
      });

      if (response.ok) {
        setHasChanges(false);
        onSave?.();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion
  const completionStats = useMemo(() => {
    const requiredFields = fields.filter((f) => f.required);
    const filledRequired = requiredFields.filter((f) => {
      const v = values[f.esaCode];
      return v && v.value && v.value.length > 0;
    }).length;
    const percent =
      requiredFields.length > 0
        ? Math.round((filledRequired / requiredFields.length) * 100)
        : 100;
    return { filledRequired, totalRequired: requiredFields.length, percent };
  }, [fields, values]);

  if (!template) return null;

  const templateInfo = ROI_TEMPLATES[template.templateId as RoiTemplateId];
  const hasRecords = records.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{template.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {template.templateId} • {templateInfo?.esaReference}
              </SheetDescription>
            </div>
            <Badge
              variant={completionStats.percent === 100 ? 'default' : 'secondary'}
              className="shrink-0 ml-2"
            >
              {completionStats.percent}%
            </Badge>
          </div>

          {/* Record Navigation */}
          {hasRecords && (
            <div className="flex items-center justify-between pt-3">
              <div className="text-sm text-muted-foreground">
                Record {currentIndex + 1} of {records.length}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevRecord}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextRecord}
                  disabled={currentIndex >= records.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : fields.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                This template is auto-generated from relationships
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/roi/${template.templateId}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Full Editor
              </Button>
            </div>
          ) : !hasRecords ? (
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
                      onChange={(v) => handleValueChange(field.esaCode, v)}
                      onLeiSearch={(q) => handleLeiSearch(field.esaCode, q)}
                      showLeiSuggestions={
                        leiSearchField === field.esaCode && leiSuggestions.length > 0
                      }
                      leiSuggestions={leiSuggestions}
                      leiSearching={leiSearching && leiSearchField === field.esaCode}
                      onSelectLei={handleSelectLei}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Group fields by category for better UX */}
              {fields.map((field) => (
                <FieldInput
                  key={field.esaCode}
                  field={field}
                  value={values[field.esaCode]}
                  onChange={(v) => handleValueChange(field.esaCode, v)}
                  onLeiSearch={(q) => handleLeiSearch(field.esaCode, q)}
                  showLeiSuggestions={
                    leiSearchField === field.esaCode && leiSuggestions.length > 0
                  }
                  leiSuggestions={leiSuggestions}
                  leiSearching={leiSearching && leiSearchField === field.esaCode}
                  onSelectLei={handleSelectLei}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/roi/${template.templateId}`)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Full Editor
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Field Input Component
// ============================================================================

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

function FieldInput({
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

    // Special handling for country codes
    if (field.enumeration === EBA_COUNTRY_CODES) {
      return Object.entries(field.enumeration).map(([code, ebaValue]) => ({
        value: ebaValue,
        label: formatCountryOption(code),
      }));
    }

    return Object.entries(field.enumeration).map(([key, ebaValue]) => ({
      value: ebaValue,
      label: formatEnumKey(key),
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
