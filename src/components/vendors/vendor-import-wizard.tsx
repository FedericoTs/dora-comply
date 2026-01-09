'use client';

/**
 * Vendor Import Wizard
 *
 * Multi-step dialog for importing vendors from CSV files.
 * Steps: Upload → Map Columns → Preview → Import
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Check, AlertTriangle, X, Download, ChevronRight, ChevronLeft, Loader2, Table, ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
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

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface VendorImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (count: number) => void;
}

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'upload', title: 'Upload File', description: 'Select a CSV file to import' },
  { id: 'mapping', title: 'Map Columns', description: 'Match CSV columns to vendor fields' },
  { id: 'preview', title: 'Preview', description: 'Review and validate data' },
  { id: 'importing', title: 'Importing', description: 'Creating vendors...' },
  { id: 'complete', title: 'Complete', description: 'Import finished' },
];

export function VendorImportWizard({
  open,
  onOpenChange,
  onImportComplete,
}: VendorImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when closing
  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedCSV(null);
    setMappings([]);
    setPreview(null);
    setError(null);
    setImportProgress(0);
    setImportResult(null);
    onOpenChange(false);
  };

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Column mapping
  const handleMappingChange = (csvColumn: string, vendorField: VendorImportField | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvColumn === csvColumn
          ? { ...m, vendorField, required: vendorField ? VENDOR_IMPORT_FIELDS[vendorField].required : false }
          : m
      )
    );
  };

  // Preview generation
  const generatePreviewData = useCallback(() => {
    if (!parsedCSV) return;

    const previewData = generateImportPreview(parsedCSV, mappings);
    setPreview(previewData);
  }, [parsedCSV, mappings]);

  // Import execution
  const executeImport = async () => {
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
  };

  // Download template
  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigation
  const canProceed = () => {
    switch (step) {
      case 'upload':
        return !!parsedCSV;
      case 'mapping':
        // Must have name mapped
        return mappings.some((m) => m.vendorField === 'name');
      case 'preview':
        return preview && preview.validRows > 0;
      default:
        return false;
    }
  };

  const goNext = () => {
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
  };

  const goPrev = () => {
    switch (step) {
      case 'mapping':
        setStep('upload');
        break;
      case 'preview':
        setStep('mapping');
        break;
    }
  };

  // Get step index for progress
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Vendors from CSV</DialogTitle>
          <DialogDescription>
            {STEPS.find((s) => s.id === step)?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          {STEPS.slice(0, -2).map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  stepIndex > i
                    ? 'bg-primary text-primary-foreground'
                    : stepIndex === i
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {stepIndex > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 3 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-1',
                    stepIndex > i ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                  error
                    ? 'border-destructive bg-destructive/5'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {file ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedCSV?.rows.length} rows, {parsedCSV?.columns.length} columns
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setParsedCSV(null);
                        setMappings([]);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drag and drop your CSV file here, or{' '}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground">Maximum 500 vendors, 5MB file size</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <p className="text-xs text-muted-foreground">
                  Need help? Download our CSV template with all supported fields.
                </p>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && parsedCSV && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRightLeft className="h-4 w-4" />
                Map your CSV columns to vendor fields. Required fields are marked with *.
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CSV Column</TableHead>
                      <TableHead>Sample Data</TableHead>
                      <TableHead>Map To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping) => {
                      const column = parsedCSV.columns.find((c) => c.header === mapping.csvColumn);
                      return (
                        <TableRow key={mapping.csvColumn}>
                          <TableCell className="font-medium">{mapping.csvColumn}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {column?.sampleValues.filter(Boolean).join(', ') || '(empty)'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping.vendorField || 'none'}
                              onValueChange={(value) =>
                                handleMappingChange(
                                  mapping.csvColumn,
                                  value === 'none' ? null : (value as VendorImportField)
                                )
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Skip this column" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Skip this column</SelectItem>
                                {Object.entries(VENDOR_IMPORT_FIELDS).map(([key, field]) => {
                                  const alreadyMapped = mappings.some(
                                    (m) => m.vendorField === key && m.csvColumn !== mapping.csvColumn
                                  );
                                  return (
                                    <SelectItem
                                      key={key}
                                      value={key}
                                      disabled={alreadyMapped}
                                    >
                                      {field.label}
                                      {field.required && ' *'}
                                      {alreadyMapped && ' (mapped)'}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </UITable>
              </ScrollArea>

              {!mappings.some((m) => m.vendorField === 'name') && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  You must map a column to &quot;Vendor Name&quot; to continue.
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-semibold">{preview.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <div className="text-2xl font-semibold text-green-700">{preview.validRows}</div>
                  <div className="text-sm text-green-600">Valid</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <div className="text-2xl font-semibold text-red-700">{preview.invalidRows}</div>
                  <div className="text-sm text-red-600">Invalid</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <div className="text-2xl font-semibold text-amber-700">
                    {preview.duplicateLEIs.length + preview.duplicateNames.length}
                  </div>
                  <div className="text-sm text-amber-600">Duplicates</div>
                </div>
              </div>

              {/* Warnings */}
              {(preview.duplicateLEIs.length > 0 || preview.duplicateNames.length > 0) && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                  <div className="flex items-center gap-2 font-medium text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Duplicate entries detected
                  </div>
                  {preview.duplicateLEIs.length > 0 && (
                    <p className="mt-1 text-amber-700">
                      Duplicate LEIs: {preview.duplicateLEIs.join(', ')}
                    </p>
                  )}
                  {preview.duplicateNames.length > 0 && (
                    <p className="mt-1 text-amber-700">
                      Duplicate names: {preview.duplicateNames.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Data preview table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Row</TableHead>
                      <TableHead className="w-[60px]">Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>LEI</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 50).map((row) => (
                      <TableRow
                        key={row.rowIndex}
                        className={cn(!row.isValid && 'bg-red-50')}
                      >
                        <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <X className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.data.name || '(empty)'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.data.lei || '-'}
                        </TableCell>
                        <TableCell>
                          {row.data.tier && (
                            <Badge variant="outline">{row.data.tier}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-destructive max-w-[200px]">
                          {row.errors.map((e) => e.message).join('; ')}
                          {row.warnings.length > 0 && (
                            <span className="text-amber-600">
                              {row.warnings.join('; ')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              </ScrollArea>

              {preview.rows.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing first 50 of {preview.rows.length} rows
                </p>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importing vendors...</p>
              <Progress value={importProgress} className="w-64" />
              <p className="text-sm text-muted-foreground">{importProgress}% complete</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {importResult.success > 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium">Import Complete!</p>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">vendors imported successfully</p>
                  </div>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-amber-600">
                      {importResult.failed} vendors failed to import
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-lg font-medium">Import Failed</p>
                  <p className="text-sm text-muted-foreground">
                    No vendors were imported. Please check your data and try again.
                  </p>
                </>
              )}
            </div>
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
