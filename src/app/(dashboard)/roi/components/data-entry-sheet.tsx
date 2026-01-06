'use client';

/**
 * Data Entry Sheet
 *
 * Slide-out panel for editing RoI template data without navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { RoiTemplateId, TemplateWithStatus } from '@/lib/roi/types';

interface DataEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateWithStatus | null;
  onSave?: () => void;
}

interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'number' | 'textarea' | 'lei';
  required: boolean;
  options?: { value: string; label: string }[];
  description?: string;
  group?: string;
  aiPopulated?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
}

interface FieldValue {
  id: string;
  value: string;
  isValid: boolean;
  error?: string;
  isAiPopulated?: boolean;
}

// Mock field definitions for different templates
const TEMPLATE_FIELDS: Record<string, FieldDefinition[]> = {
  B_01_01: [
    { id: 'legal_name', name: 'Legal Name', type: 'text', required: true, group: 'Identity' },
    { id: 'lei_code', name: 'LEI Code', type: 'lei', required: true, group: 'Identity', validation: { pattern: /^[A-Z0-9]{20}$/ } },
    { id: 'country', name: 'Country', type: 'select', required: true, group: 'Identity', options: [
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'ES', label: 'Spain' },
      { value: 'IT', label: 'Italy' },
      { value: 'NL', label: 'Netherlands' },
    ]},
    { id: 'entity_type', name: 'Entity Type', type: 'select', required: true, group: 'Classification', options: [
      { value: 'CRD', label: 'Credit Institution' },
      { value: 'INV', label: 'Investment Firm' },
      { value: 'INS', label: 'Insurance Company' },
    ]},
    { id: 'competent_authority', name: 'Competent Authority', type: 'text', required: false, group: 'Classification' },
  ],
  B_02_01: [
    { id: 'provider_name', name: 'Provider Name', type: 'text', required: true, group: 'Provider Details' },
    { id: 'provider_lei', name: 'Provider LEI', type: 'lei', required: true, group: 'Provider Details', validation: { pattern: /^[A-Z0-9]{20}$/ } },
    { id: 'provider_country', name: 'Provider Country', type: 'select', required: true, group: 'Provider Details', options: [
      { value: 'US', label: 'United States' },
      { value: 'DE', label: 'Germany' },
      { value: 'IE', label: 'Ireland' },
      { value: 'NL', label: 'Netherlands' },
    ]},
    { id: 'provider_type', name: 'Provider Type', type: 'select', required: true, group: 'Classification', options: [
      { value: 'CSP', label: 'Cloud Service Provider' },
      { value: 'SaaS', label: 'SaaS Provider' },
      { value: 'MSP', label: 'Managed Service Provider' },
    ]},
    { id: 'headquarters_country', name: 'HQ Country', type: 'select', required: false, group: 'Classification', options: [
      { value: 'US', label: 'United States' },
      { value: 'DE', label: 'Germany' },
      { value: 'IE', label: 'Ireland' },
    ]},
  ],
  B_03_01: [
    { id: 'contract_ref', name: 'Contract Reference', type: 'text', required: true, group: 'Contract' },
    { id: 'contract_type', name: 'Contract Type', type: 'select', required: true, group: 'Contract', options: [
      { value: 'MSA', label: 'Master Service Agreement' },
      { value: 'SLA', label: 'Service Level Agreement' },
      { value: 'DPA', label: 'Data Processing Agreement' },
    ]},
    { id: 'start_date', name: 'Start Date', type: 'date', required: true, group: 'Dates' },
    { id: 'end_date', name: 'End Date', type: 'date', required: false, group: 'Dates' },
    { id: 'annual_value', name: 'Annual Value (EUR)', type: 'number', required: false, group: 'Financial' },
  ],
};

export function DataEntrySheet({
  open,
  onOpenChange,
  template,
  onSave,
}: DataEntrySheetProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);

  // Load fields when template changes
  useEffect(() => {
    if (template) {
      const templateKey = template.templateId.replace('.', '_');
      const templateFields = TEMPLATE_FIELDS[templateKey] || [];
      setFields(templateFields);

      // Initialize values (would fetch from API in real implementation)
      const initialValues: Record<string, FieldValue> = {};
      templateFields.forEach((field) => {
        initialValues[field.id] = {
          id: field.id,
          value: '',
          isValid: !field.required,
          isAiPopulated: false,
        };
      });
      setValues(initialValues);
      setHasChanges(false);
    }
  }, [template]);

  const handleValueChange = useCallback((fieldId: string, newValue: string) => {
    setValues((prev) => {
      const field = fields.find((f) => f.id === fieldId);
      const isValid = validateField(field!, newValue);

      return {
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          value: newValue,
          isValid,
          error: isValid ? undefined : getFieldError(field!, newValue),
        },
      };
    });
    setHasChanges(true);
  }, [fields]);

  const validateField = (field: FieldDefinition, value: string): boolean => {
    if (field.required && !value) return false;
    if (field.validation?.pattern && value && !field.validation.pattern.test(value)) return false;
    if (field.validation?.minLength && value.length < field.validation.minLength) return false;
    if (field.validation?.maxLength && value.length > field.validation.maxLength) return false;
    return true;
  };

  const getFieldError = (field: FieldDefinition, value: string): string => {
    if (field.required && !value) return 'This field is required';
    if (field.validation?.pattern && value && !field.validation.pattern.test(value)) {
      if (field.type === 'lei') return 'Invalid LEI format (20 alphanumeric characters)';
      return 'Invalid format';
    }
    return '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Would save to API in real implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasChanges(false);
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  const groups = ['all', ...new Set(fields.map((f) => f.group).filter(Boolean))] as string[];
  const filteredFields = activeGroup === 'all'
    ? fields
    : fields.filter((f) => f.group === activeGroup);

  const validFieldCount = Object.values(values).filter((v) => v.isValid && v.value).length;
  const totalRequiredFields = fields.filter((f) => f.required).length;
  const completionPercent = totalRequiredFields > 0
    ? Math.round((validFieldCount / totalRequiredFields) * 100)
    : 0;

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">{template.name}</SheetTitle>
              <SheetDescription className="text-sm">
                Template {template.templateId} • {template.rowCount} record{template.rowCount !== 1 ? 's' : ''}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={completionPercent === 100 ? 'default' : 'secondary'}>
                {completionPercent}% complete
              </Badge>
            </div>
          </div>

          {/* Group Tabs */}
          {groups.length > 2 && (
            <div className="pt-3">
              <Tabs value={activeGroup} onValueChange={setActiveGroup}>
                <TabsList className="w-full justify-start">
                  {groups.map((group) => (
                    <TabsTrigger key={group} value={group} className="capitalize">
                      {group}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </SheetHeader>

        {/* Fields */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {filteredFields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(value) => handleValueChange(field.id, value)}
              />
            ))}

            {filteredFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No fields in this group
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <a href={`/roi/templates/${template.templateId}`} target="_blank" rel="noopener">
                <ExternalLink className="mr-2 h-4 w-4" />
                Full Editor
              </a>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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

interface FieldInputProps {
  field: FieldDefinition;
  value?: FieldValue;
  onChange: (value: string) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const hasError = value && !value.isValid && value.value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={field.id}
          className={cn(
            'flex items-center gap-1.5',
            hasError && 'text-destructive'
          )}
        >
          {field.name}
          {field.required && <span className="text-destructive">*</span>}
          {value?.isAiPopulated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Sparkles className="h-3 w-3 text-primary" />
                </TooltipTrigger>
                <TooltipContent>Auto-populated by AI</TooltipContent>
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

      {field.type === 'select' && field.options ? (
        <Select value={value?.value || ''} onValueChange={onChange}>
          <SelectTrigger
            id={field.id}
            className={cn(hasError && 'border-destructive')}
          >
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'textarea' ? (
        <Textarea
          id={field.id}
          value={value?.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          className={cn(hasError && 'border-destructive')}
        />
      ) : (
        <Input
          id={field.id}
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value?.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          className={cn(
            hasError && 'border-destructive',
            value?.isAiPopulated && 'bg-primary/5 border-primary/20'
          )}
        />
      )}

      {field.description && !hasError && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {hasError && value?.error && (
        <p className="text-xs text-destructive">{value.error}</p>
      )}
    </div>
  );
}
