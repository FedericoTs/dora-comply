'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { UseFormReturn } from 'react-hook-form';
import type { CreateContractFormData } from '@/lib/contracts';
import type { ScanResult } from './types';

interface UseDocumentScanProps {
  form: UseFormReturn<CreateContractFormData>;
}

export function useDocumentScan({ form }: UseDocumentScanProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    setUploadedFile(file);
    setScanError(null);
    setScanResult(null);
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server. The scan may have timed out.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('Invalid JSON response:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(result.error?.message || 'Scan failed');
      }

      const scan = result.data.scan;
      const suggestions = result.data.formSuggestions;

      setScanResult(scan);

      // Auto-populate form fields from scan
      if (suggestions.name && !form.getValues('contract_ref')) {
        form.setValue('contract_ref', suggestions.name);
      }
      if (suggestions.contractType) {
        form.setValue('contract_type', suggestions.contractType as CreateContractFormData['contract_type']);
      }
      if (suggestions.effectiveDate) {
        form.setValue('effective_date', suggestions.effectiveDate);
      }
      if (suggestions.expiryDate) {
        form.setValue('expiry_date', suggestions.expiryDate);
      }

      // Add services to notes if detected
      if (suggestions.services.length > 0) {
        const currentNotes = form.getValues('notes') || '';
        const servicesNote = `Services detected: ${suggestions.services.join(', ')}`;
        if (!currentNotes.includes(servicesNote)) {
          form.setValue('notes', currentNotes ? `${currentNotes}\n\n${servicesNote}` : servicesNote);
        }
      }

      toast.success('Document scanned successfully! Fields auto-populated.');
    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error instanceof Error ? error.message : 'Scan failed');
      toast.error('Failed to scan document');
    } finally {
      setIsScanning(false);
    }
  }, [form]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const clearUploadedFile = useCallback(() => {
    setUploadedFile(null);
    setScanResult(null);
    setScanError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    uploadedFile,
    isScanning,
    scanResult,
    scanError,
    fileInputRef,
    handleFileSelect,
    handleFileInputChange,
    clearUploadedFile,
    triggerFileInput,
  };
}
