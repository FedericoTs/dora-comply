'use client';

/**
 * Vendor Import Wizard
 *
 * Multi-step dialog for importing vendors from CSV files.
 * Steps: Upload → Map Columns → Preview → Import
 */

import { ChevronRight, ChevronLeft, Table } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useVendorImportWizard } from './use-vendor-import-wizard';
import { UploadStep } from './upload-step';
import { MappingStep } from './mapping-step';
import { PreviewStep } from './preview-step';
import { ImportingStep, CompleteStep } from './import-status-steps';
import { WizardProgress } from './wizard-progress';
import { WIZARD_STEPS } from './types';

interface VendorImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (count: number) => void;
}

export function VendorImportWizard({
  open,
  onOpenChange,
  onImportComplete,
}: VendorImportWizardProps) {
  const {
    step,
    file,
    parsedCSV,
    mappings,
    preview,
    error,
    importProgress,
    importResult,
    fileInputRef,
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
  } = useVendorImportWizard({
    onImportComplete,
    onClose: () => onOpenChange(false),
  });

  const currentStepConfig = WIZARD_STEPS.find((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Vendors from CSV</DialogTitle>
          <DialogDescription>
            {currentStepConfig?.description}
          </DialogDescription>
        </DialogHeader>

        <WizardProgress currentStep={step} />

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <UploadStep
              file={file}
              parsedCSV={parsedCSV}
              error={error}
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClearFile={clearFile}
              onTriggerFileInput={triggerFileInput}
              onDownloadTemplate={downloadTemplate}
            />
          )}

          {step === 'mapping' && parsedCSV && (
            <MappingStep
              parsedCSV={parsedCSV}
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />
          )}

          {step === 'preview' && preview && (
            <PreviewStep preview={preview} />
          )}

          {step === 'importing' && (
            <ImportingStep progress={importProgress} />
          )}

          {step === 'complete' && importResult && (
            <CompleteStep result={importResult} />
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {(step === 'mapping' || step === 'preview') && (
              <Button variant="outline" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 'complete' ? (
              <Button onClick={handleClose}>Done</Button>
            ) : step !== 'importing' ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={goNext} disabled={!canProceed()}>
                  {step === 'preview' ? (
                    <>
                      <Table className="h-4 w-4 mr-1" />
                      Import {preview?.validRows} Vendors
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
