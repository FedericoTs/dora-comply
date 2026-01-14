'use client';

import { useState, useCallback, useRef } from 'react';
import {
  parseCSV,
  autoMapColumns,
  generateImportPreview,
  generateCSVTemplate,
  VENDOR_IMPORT_FIELDS,
  type ParsedCSV,
  type ColumnMapping,
  type ImportPreview,
  type VendorImportField,
} from '@/lib/vendors/csv-import';
import type { WizardStep, ImportResult } from './types';

interface UseVendorImportWizardProps {
  onImportComplete: (count: number) => void;
  onClose: () => void;
}

export function useVendorImportWizard({ onImportComplete, onClose }: UseVendorImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state
  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsedCSV(null);
    setMappings([]);
    setPreview(null);
    setError(null);
    setImportProgress(0);
    setImportResult(null);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // File handling
  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);

        if (parsed.rows.length === 0) {
          setError('CSV file contains no data rows');
          return;
        }

        if (parsed.rows.length > 500) {
          setError('Maximum 500 vendors per import. Please split your file.');
          return;
        }

        setFile(selectedFile);
        setParsedCSV(parsed);

        // Auto-map columns
        const autoMappings = autoMapColumns(parsed.headers);
        setMappings(autoMappings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Clear file
  const clearFile = useCallback(() => {
    setFile(null);
    setParsedCSV(null);
    setMappings([]);
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Column mapping
  const handleMappingChange = useCallback((csvColumn: string, vendorField: VendorImportField | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvColumn === csvColumn
          ? { ...m, vendorField, required: vendorField ? VENDOR_IMPORT_FIELDS[vendorField].required : false }
          : m
      )
    );
  }, []);

  // Preview generation
  const generatePreviewData = useCallback(() => {
    if (!parsedCSV) return;
    const previewData = generateImportPreview(parsedCSV, mappings);
    setPreview(previewData);
  }, [parsedCSV, mappings]);

  // Import execution
  const executeImport = useCallback(async () => {
    if (!preview) return;

    setStep('importing');
    setImportProgress(0);

    const validRows = preview.rows.filter((r) => r.isValid);
    let successCount = 0;
    let failedCount = 0;

    // Import in batches
    const batchSize = 10;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);

      try {
        const response = await fetch('/api/vendors/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendors: batch.map((r) => r.data) }),
        });

        const result = await response.json();
        if (result.success) {
          successCount += result.data?.created || batch.length;
        } else {
          failedCount += batch.length;
        }
      } catch {
        failedCount += batch.length;
      }

      setImportProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    setImportResult({ success: successCount, failed: failedCount });
    setStep('complete');
    if (successCount > 0) {
      onImportComplete(successCount);
    }
  }, [preview, onImportComplete]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Navigation
  const canProceed = useCallback(() => {
    switch (step) {
      case 'upload':
        return !!parsedCSV;
      case 'mapping':
        return mappings.some((m) => m.vendorField === 'name');
      case 'preview':
        return preview && preview.validRows > 0;
      default:
        return false;
    }
  }, [step, parsedCSV, mappings, preview]);

  const goNext = useCallback(() => {
    switch (step) {
      case 'upload':
        setStep('mapping');
        break;
      case 'mapping':
        generatePreviewData();
        setStep('preview');
        break;
      case 'preview':
        executeImport();
        break;
    }
  }, [step, generatePreviewData, executeImport]);

  const goPrev = useCallback(() => {
    switch (step) {
      case 'mapping':
        setStep('upload');
        break;
      case 'preview':
        setStep('mapping');
        break;
    }
  }, [step]);

  return {
    // State
    step,
    file,
    parsedCSV,
    mappings,
    preview,
    error,
    importProgress,
    importResult,
    fileInputRef,
    // Actions
    handleClose,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    clearFile,
    triggerFileInput,
    handleMappingChange,
    downloadTemplate,
    canProceed,
    goNext,
    goPrev,
  };
}
