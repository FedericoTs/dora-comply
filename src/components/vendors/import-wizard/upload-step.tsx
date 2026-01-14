'use client';

import { RefObject } from 'react';
import { Upload, FileText, X, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ParsedCSV } from '@/lib/vendors/csv-import';

interface UploadStepProps {
  file: File | null;
  parsedCSV: ParsedCSV | null;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onClearFile: () => void;
  onTriggerFileInput: () => void;
  onDownloadTemplate: () => void;
}

export function UploadStep({
  file,
  parsedCSV,
  error,
  fileInputRef,
  onFileSelect,
  onDrop,
  onDragOver,
  onClearFile,
  onTriggerFileInput,
  onDownloadTemplate,
}: UploadStepProps) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          error
            ? 'border-destructive bg-destructive/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />

        {file ? (
          <div className="space-y-2">
            <FileText className="h-12 w-12 mx-auto text-primary" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {parsedCSV?.rows.length} rows, {parsedCSV?.columns.length} columns
            </p>
            <Button variant="outline" size="sm" onClick={onClearFile}>
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
                onClick={onTriggerFileInput}
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
        <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        <p className="text-xs text-muted-foreground">
          Need help? Download our CSV template with all supported fields.
        </p>
      </div>
    </div>
  );
}
