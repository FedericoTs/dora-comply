'use client';

/**
 * Contract Form Dialog
 *
 * Dialog component for creating/editing vendor contracts
 * Supports optional PDF upload with AI-powered quick scan to auto-populate fields
 */

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ContractFormDialogProps } from './types';
import { useContractForm } from './use-contract-form';
import { useDocumentScan } from './use-document-scan';
import { PdfUploadSection } from './pdf-upload-section';
import {
  ContractRefAndTypeFields,
  DateFields,
  RenewalFields,
  FinancialFields,
  NotesField,
} from './contract-fields';

export function ContractFormDialog({
  vendorId,
  contract,
  open,
  onOpenChange,
  onSuccess,
}: ContractFormDialogProps) {
  const { form, isLoading, isEditing, onSubmit, resetForm } = useContractForm({
    vendorId,
    contract,
    onOpenChange,
    onSuccess,
  });

  const {
    uploadedFile,
    isScanning,
    scanResult,
    scanError,
    fileInputRef,
    handleFileInputChange,
    clearUploadedFile,
    triggerFileInput,
  } = useDocumentScan({ form });

  // Handle dialog open/close state changes
  useEffect(() => {
    if (!open) {
      // Reset form and clear file upload state when closing
      resetForm();
      clearUploadedFile();
    } else if (contract) {
      // Reset to contract values when opening for edit
      resetForm(contract);
    }
  }, [open, contract, resetForm, clearUploadedFile]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contract' : 'Add Contract'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the contract information below.'
              : 'Add a new contract for this vendor. Required for DORA RoI template B_03.01.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Optional PDF Upload with Quick Scan */}
          {!isEditing && (
            <PdfUploadSection
              uploadedFile={uploadedFile}
              isScanning={isScanning}
              scanResult={scanResult}
              scanError={scanError}
              fileInputRef={fileInputRef}
              onFileInputChange={handleFileInputChange}
              onClearFile={clearUploadedFile}
              onTriggerInput={triggerFileInput}
            />
          )}

          {/* Contract Reference and Type */}
          <ContractRefAndTypeFields form={form} />

          {/* Dates */}
          <DateFields form={form} />

          {/* Renewal Settings */}
          <RenewalFields form={form} />

          {/* Financial */}
          <FinancialFields form={form} />

          {/* Notes */}
          <NotesField form={form} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Contract' : 'Add Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
