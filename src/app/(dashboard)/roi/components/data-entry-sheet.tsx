'use client';

/**
 * Data Entry Sheet - Enhanced 10X Version
 *
 * Features:
 * - Dual view: Record Grid + Detail Editor
 * - Quick record picker with visual preview
 * - Keyboard navigation (←→ arrows)
 * - Batch selection for bulk operations
 * - LEI search integration
 * - Inline validation
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  List,
  Grid3X3,
  Check,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_MAPPINGS,
  getColumnOrder,
  EBA_COUNTRY_CODES,
  type ColumnMapping,
} from '@/lib/roi/mappings';
import {
  ROI_TEMPLATES,
  templateIdToUrl,
  getTemplateUrl,
  type RoiTemplateId,
  type TemplateWithStatus,
} from '@/lib/roi/types';
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

type ViewMode = 'list' | 'detail';

// Get primary display fields for a template (for record grid preview)
function getPrimaryFields(templateId: RoiTemplateId): string[] {
  const primaryFieldMap: Record<string, string[]> = {
    'B_01.01': ['c0020', 'c0010', 'c0030'], // Name, LEI, Country
    'B_01.02': ['c0020', 'c0010', 'c0040'], // Name, LEI, Type
    'B_01.03': ['c0030', 'c0040', 'c0020'], // Branch name, Country, Head office
    'B_02.01': ['c0010', 'c0020'], // Contract ref, Type
    'B_02.02': ['c0010', 'c0020', 'c0030'], // Contract ref, Entity LEI, Provider
    'B_03.01': ['c0010', 'c0020'], // Contract ref, Entity LEI
    'B_05.01': ['c0020', 'c0010', 'c0040'], // Name, LEI, Country
    'B_06.01': ['c0030', 'c0050', 'c0040'], // Function name, Criticality, Entity
    'B_07.01': ['c0010', 'c0050', 'c0080'], // Contract ref, Substitutability, Exit plan
  };
  return primaryFieldMap[templateId] || ['c0010', 'c0020'];
}

// Get record summary for display in list
function getRecordSummary(record: Record<string, unknown>, fields: ColumnMapping[]): string {
  const primaryField = fields.find(f =>
    f.esaCode === 'c0020' || f.esaCode === 'c0030' || f.description.toLowerCase().includes('name')
  );
  if (primaryField) {
    return (record[primaryField.esaCode] as string) || 'Unnamed';
  }
  return (record['c0010'] as string) || 'Record';
}

// Get record identifier (LEI, contract ref, etc.)
function getRecordIdentifier(record: Record<string, unknown>): string {
  const id = record['c0010'] as string;
  if (id && id.length > 12) {
    return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
  }
  return id || '-';
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
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [recordPickerOpen, setRecordPickerOpen] = useState(false);

  // LEI search state
  const [leiSearchField, setLeiSearchField] = useState<string | null>(null);
  const [leiSearching, setLeiSearching] = useState(false);
  const [leiSuggestions, setLeiSuggestions] = useState<GLEIFEntity[]>([]);

  // Keyboard navigation ref
  const sheetRef = useRef<HTMLDivElement>(null);

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

  // Get primary display fields
  const primaryFields = useMemo(() => {
    if (!template) return [];
    const primaryCodes = getPrimaryFields(template.templateId as RoiTemplateId);
    return primaryCodes
      .map(code => fields.find(f => f.esaCode === code))
      .filter((f): f is ColumnMapping => f !== undefined);
  }, [template, fields]);

  // Load data when template changes
  useEffect(() => {
    if (!template || !open) return;

    const currentTemplate = template;

    async function loadData() {
      setIsLoading(true);
      try {
        const urlId = templateIdToUrl(currentTemplate.templateId as RoiTemplateId);
        const response = await fetch(`/api/roi/${urlId}`);
        if (response.ok) {
          const result = await response.json();
          const data = result.data?.rows || [];
          setRecords(data);
          setCurrentIndex(0);
          setSelectedRecords(new Set());

          if (data.length > 0) {
            initializeValues(data[0]);
          } else {
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

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open || viewMode !== 'detail') return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        navigateToRecord(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < records.length - 1) {
        e.preventDefault();
        navigateToRecord(currentIndex + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, viewMode, currentIndex, records.length]);

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

  const navigateToRecord = useCallback((index: number) => {
    if (index >= 0 && index < records.length) {
      setCurrentIndex(index);
      initializeValues(records[index]);
      setViewMode('detail');
    }
  }, [records, initializeValues]);

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
    setLeiSearching(true);
    setLeiSuggestions([]);

    try {
      if (query.length === 20 && /^[A-Z0-9]+$/.test(query)) {
        const result = await validateLEI(query);
        if (result.valid && result.entity) {
          setLeiSuggestions([result.entity]);
        }
      } else {
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

      handleValueChange(leiSearchField, entity.lei);

      // Auto-fill related fields
      const nameFields = ['c0020', 'c0050'];
      const countryFields = ['c0030', 'c0080'];

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

      setLeiSearchField(null);
      setLeiSuggestions([]);
    },
    [leiSearchField, values, handleValueChange]
  );

  const handleSave = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      const record: Record<string, unknown> = {};
      Object.entries(values).forEach(([code, fieldValue]) => {
        record[code] = fieldValue.value;
      });

      const urlId = templateIdToUrl(template.templateId as RoiTemplateId);
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

  const toggleRecordSelection = (index: number) => {
    setSelectedRecords(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
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
  const currentRecord = records[currentIndex];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full overflow-hidden" ref={sheetRef}>
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{template.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {template.templateId} • {templateInfo?.esaReference}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              {hasRecords && records.length > 1 && (
                <div className="flex items-center border rounded-lg p-0.5">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('list')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'detail' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('detail')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Badge
                variant={completionStats.percent === 100 ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {completionStats.percent}%
              </Badge>
            </div>
          </div>

          {/* Record Navigation - Enhanced */}
          {hasRecords && viewMode === 'detail' && (
            <div className="flex items-center justify-between pt-3 gap-2">
              {/* Record Picker */}
              <Popover open={recordPickerOpen} onOpenChange={setRecordPickerOpen}>
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
                              navigateToRecord(index);
                              setRecordPickerOpen(false);
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
                  onClick={() => navigateToRecord(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateToRecord(currentIndex + 1)}
                  disabled={currentIndex >= records.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          {hasRecords && viewMode === 'detail' && records.length > 1 && (
            <p className="text-xs text-muted-foreground pt-2">
              Use ← → arrow keys to navigate between records
            </p>
          )}
        </SheetHeader>

        {/* Content - scrollable area */}
        <ScrollArea className="flex-1 overflow-auto">
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
                onClick={() => router.push(getTemplateUrl(template.templateId as RoiTemplateId))}
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
          ) : viewMode === 'list' ? (
            /* List View - Record Grid */
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
                    onClick={() => navigateToRecord(index)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRecords.has(index)}
                        onCheckedChange={() => toggleRecordSelection(index)}
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
                    onClick={() => setSelectedRecords(new Set())}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Detail View - Field Editor */
            <div className="p-6 space-y-4">
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
              onClick={() => router.push(getTemplateUrl(template.templateId as RoiTemplateId))}
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
