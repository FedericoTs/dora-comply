'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TEMPLATE_MAPPINGS,
  getColumnOrder,
  type ColumnMapping,
} from '@/lib/roi/mappings';
import {
  templateIdToUrl,
  type RoiTemplateId,
  type TemplateWithStatus,
} from '@/lib/roi/types';
import { searchEntities, validateLEI } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

export interface FieldValue {
  value: string;
  isValid: boolean;
  error?: string;
  isAiPopulated?: boolean;
}

export type ViewMode = 'list' | 'detail';

// Get primary display fields for a template (for record grid preview)
export function getPrimaryFields(templateId: RoiTemplateId): string[] {
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
export function getRecordSummary(record: Record<string, unknown>, fields: ColumnMapping[]): string {
  const primaryField = fields.find(f =>
    f.esaCode === 'c0020' || f.esaCode === 'c0030' || f.description.toLowerCase().includes('name')
  );
  if (primaryField) {
    return (record[primaryField.esaCode] as string) || 'Unnamed';
  }
  return (record['c0010'] as string) || 'Record';
}

// Get record identifier (LEI, contract ref, etc.)
export function getRecordIdentifier(record: Record<string, unknown>): string {
  const id = record['c0010'] as string;
  if (id && id.length > 12) {
    return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
  }
  return id || '-';
}

interface UseDataEntrySheetOptions {
  template: TemplateWithStatus | null;
  open: boolean;
  onSave?: () => void;
}

export function useDataEntrySheet({ template, open, onSave }: UseDataEntrySheetOptions) {
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
  const primaryFieldsMapped = useMemo(() => {
    if (!template) return [];
    const primaryCodes = getPrimaryFields(template.templateId as RoiTemplateId);
    return primaryCodes
      .map(code => fields.find(f => f.esaCode === code))
      .filter((f): f is ColumnMapping => f !== undefined);
  }, [template, fields]);

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
  }, [template, open, initializeValues, initializeEmptyValues]);

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
  }, [open, viewMode, currentIndex, records.length, navigateToRecord]);

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

  const clearSelection = () => setSelectedRecords(new Set());

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

  const hasRecords = records.length > 0;
  const currentRecord = records[currentIndex];

  return {
    // State
    isLoading,
    isSaving,
    records,
    currentIndex,
    values,
    hasChanges,
    viewMode,
    selectedRecords,
    recordPickerOpen,
    leiSearchField,
    leiSearching,
    leiSuggestions,
    fields,
    primaryFields: primaryFieldsMapped,
    completionStats,
    hasRecords,
    currentRecord,

    // Setters
    setViewMode,
    setRecordPickerOpen,

    // Handlers
    navigateToRecord,
    handleValueChange,
    handleLeiSearch,
    handleSelectLei,
    handleSave,
    toggleRecordSelection,
    clearSelection,
  };
}
