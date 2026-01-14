'use client';

import { RefObject } from 'react';
import { Upload, FileText, Loader2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ScanResult } from './types';
import { ScanResultsDisplay } from './scan-results-display';

interface PdfUploadSectionProps {
  uploadedFile: File | null;
  isScanning: boolean;
  scanResult: ScanResult | null;
  scanError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onTriggerInput: () => void;
}

export function PdfUploadSection({
  uploadedFile,
  isScanning,
  scanResult,
  scanError,
  fileInputRef,
  onFileInputChange,
  onClearFile,
  onTriggerInput,
}: PdfUploadSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <Label>Quick Scan (Optional)</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload a contract PDF to automatically extract and populate fields using AI.
      </p>

      {!uploadedFile ? (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer',
            'hover:border-primary/50 hover:bg-muted/30',
            isScanning && 'pointer-events-none opacity-50'
          )}
          onClick={onTriggerInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileInputChange}
            disabled={isScanning}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drop PDF here or click to upload</p>
              <p className="text-xs text-muted-foreground">Max 10MB • PDF only</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isScanning && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </div>
              )}
              {scanResult && (
                <Badge variant="outline" className="gap-1 text-success border-success">
                  <CheckCircle2 className="h-3 w-3" />
                  Scanned
                </Badge>
              )}
              {scanError && (
                <Badge variant="destructive">Failed</Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFile}
                disabled={isScanning}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {scanResult && <ScanResultsDisplay scanResult={scanResult} />}

          {scanError && (
            <p className="mt-2 text-xs text-destructive">{scanError}</p>
          )}
        </div>
      )}
    </div>
  );
}
