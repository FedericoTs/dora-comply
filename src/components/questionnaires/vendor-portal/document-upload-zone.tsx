'use client';

/**
 * DocumentUploadZone Component
 *
 * Professional document upload with automatic AI processing.
 * Displays corporate-style progress indicators during analysis.
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Server,
  Cpu,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuestionnaireDocument, DocumentType } from '@/lib/nis2-questionnaire/types';

interface DocumentUploadZoneProps {
  token: string;
  existingDocuments: QuestionnaireDocument[];
  onUploadComplete?: () => void;
}

type FileStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'processing_init'
  | 'processing_analyze'
  | 'processing_extract'
  | 'processing_save'
  | 'complete'
  | 'error';

interface UploadingFile {
  file: File;
  progress: number;
  status: FileStatus;
  documentType: DocumentType;
  error?: string;
  extractedCount?: number;
}

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'soc2', label: 'SOC 2 Report' },
  { value: 'iso27001', label: 'ISO 27001 Certificate' },
  { value: 'policy', label: 'Security Policy' },
  { value: 'certificate', label: 'Other Certification' },
  { value: 'other', label: 'Other Document' },
];

const STATUS_CONFIG: Record<
  FileStatus,
  { label: string; icon: typeof Loader2; progress: number }
> = {
  pending: { label: 'Ready', icon: FileText, progress: 0 },
  uploading: { label: 'Uploading document...', icon: Upload, progress: 15 },
  uploaded: { label: 'Upload complete', icon: CheckCircle2, progress: 25 },
  processing_init: { label: 'Initializing document processing...', icon: Server, progress: 35 },
  processing_analyze: { label: 'Analyzing document content...', icon: Cpu, progress: 55 },
  processing_extract: { label: 'Extracting compliance information...', icon: Cpu, progress: 75 },
  processing_save: { label: 'Saving extracted answers...', icon: Database, progress: 90 },
  complete: { label: 'Processing complete', icon: CheckCircle2, progress: 100 },
  error: { label: 'Error', icon: AlertCircle, progress: 0 },
};

export function DocumentUploadZone({
  token,
  existingDocuments,
  onUploadComplete,
}: DocumentUploadZoneProps) {
  const router = useRouter();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      documentType: guessDocumentType(file.name),
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  function guessDocumentType(filename: string): DocumentType {
    const lower = filename.toLowerCase();
    if (lower.includes('soc') || lower.includes('soc2')) return 'soc2';
    if (lower.includes('iso') || lower.includes('27001')) return 'iso27001';
    if (lower.includes('policy') || lower.includes('isms')) return 'policy';
    if (lower.includes('cert')) return 'certificate';
    return 'other';
  }

  function updateFileType(index: number, type: DocumentType) {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, documentType: type } : f))
    );
  }

  function removeFile(index: number) {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFileStatus(
    index: number,
    status: FileStatus,
    extra?: Partial<UploadingFile>
  ) {
    setUploadingFiles((prev) =>
      prev.map((f, i) =>
        i === index
          ? { ...f, status, progress: STATUS_CONFIG[status].progress, ...extra }
          : f
      )
    );
  }

  async function uploadAndProcess(file: UploadingFile, index: number) {
    // Phase 1: Upload
    updateFileStatus(index, 'uploading');

    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('document_type', file.documentType);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 3, 23) }
              : f
          )
        );
      }, 100);

      const uploadResponse = await fetch(`/api/vendor-portal/${token}/documents`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      updateFileStatus(index, 'uploaded');

      // Phase 2: AI Processing - automatically start
      await processDocument(index, file.file.name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateFileStatus(index, 'error', { error: errorMessage });
      toast.error(`Failed to upload ${file.file.name}`);
    }
  }

  async function processDocument(index: number, filename: string) {
    // Show processing stages with smooth progress animation
    updateFileStatus(index, 'processing_init');

    // Animate through stages while waiting for API
    const stages: FileStatus[] = ['processing_analyze', 'processing_extract', 'processing_save'];
    let currentStage = 0;

    const stageInterval = setInterval(() => {
      if (currentStage < stages.length) {
        updateFileStatus(index, stages[currentStage]);
        currentStage++;
      }
    }, 3000);

    // Also animate progress within stages
    const progressInterval = setInterval(() => {
      setUploadingFiles((prev) =>
        prev.map((f, i) => {
          if (i !== index) return f;
          if (f.status === 'complete' || f.status === 'error') return f;
          const maxProgress = STATUS_CONFIG[f.status]?.progress || 90;
          const minProgress = maxProgress - 15;
          if (f.progress < maxProgress - 2) {
            return { ...f, progress: Math.min(f.progress + 1, maxProgress - 2) };
          }
          return f;
        })
      );
    }, 500);

    try {
      // Call the process API
      const response = await fetch(`/api/vendor-portal/${token}/process`, {
        method: 'POST',
      });

      clearInterval(stageInterval);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();

      // Show completion with extracted count
      updateFileStatus(index, 'complete', {
        extractedCount: data.extracted || 0,
      });

      if (data.extracted > 0) {
        toast.success(`${data.extracted} answers extracted and saved from ${filename}`);
      } else {
        toast.info(`Document processed. No answers could be extracted.`);
      }

      // Refresh the page to show updated data
      onUploadComplete?.();

      // Force a hard refresh to ensure all data is reloaded
      setTimeout(() => {
        router.refresh();
      }, 500);

    } catch (error) {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';

      // Mark as complete but show error
      updateFileStatus(index, 'complete', {
        error: `Extraction failed: ${errorMessage}`,
        extractedCount: 0,
      });

      toast.error(`Processing failed for ${filename}. You can fill answers manually.`);
      onUploadComplete?.();
      router.refresh();
    }
  }

  async function uploadAllFiles() {
    const pendingIndices = uploadingFiles
      .map((f, i) => (f.status === 'pending' ? i : -1))
      .filter((i) => i !== -1);

    // Process files sequentially to avoid overwhelming the API
    for (const index of pendingIndices) {
      await uploadAndProcess(uploadingFiles[index], index);
    }
  }

  const pendingCount = uploadingFiles.filter((f) => f.status === 'pending').length;
  const isProcessing = uploadingFiles.some((f) =>
    [
      'uploading',
      'uploaded',
      'processing_init',
      'processing_analyze',
      'processing_extract',
      'processing_save',
    ].includes(f.status)
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed cursor-pointer transition-colors',
          isDragActive
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <CardContent className="p-8">
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Upload
                className={cn('h-6 w-6', isDragActive ? 'text-emerald-600' : 'text-gray-400')}
              />
            </div>
            <p className="text-gray-900 font-medium">
              {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">PDF files up to 50MB</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Feature Note */}
      {uploadingFiles.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
          <Cpu className="h-4 w-4 text-emerald-600" />
          <span>Documents are automatically analyzed to pre-fill questionnaire answers</span>
        </div>
      )}

      {/* Pending/Processing Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((file, index) => {
            const config = STATUS_CONFIG[file.status];
            const StatusIcon = config.icon;
            const isAnimating = [
              'uploading',
              'processing_init',
              'processing_analyze',
              'processing_extract',
              'processing_save',
            ].includes(file.status);
            const isProcessing = file.status.startsWith('processing_');

            return (
              <Card
                key={index}
                className={cn(
                  'overflow-hidden transition-all',
                  isProcessing && 'border-emerald-200'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        isProcessing ? 'bg-emerald-50' : 'bg-gray-100'
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          'h-5 w-5',
                          file.status === 'error'
                            ? 'text-red-500'
                            : file.status === 'complete'
                              ? 'text-emerald-600'
                              : isProcessing
                                ? 'text-emerald-600'
                                : 'text-gray-500',
                          isAnimating && 'animate-pulse'
                        )}
                      />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{file.file.name}</p>
                        {file.status === 'complete' &&
                          file.extractedCount !== undefined &&
                          file.extractedCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-700 font-medium"
                            >
                              {file.extractedCount} answers saved
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>

                      {/* Progress Bar */}
                      {file.status !== 'pending' && file.status !== 'complete' && (
                        <div className="mt-3">
                          <Progress
                            value={file.progress}
                            className={cn(
                              'h-2',
                              isProcessing && '[&>div]:bg-emerald-500'
                            )}
                          />
                          <p className="text-xs text-gray-600 mt-1.5 font-medium">
                            {config.label}
                          </p>
                        </div>
                      )}

                      {/* Complete state */}
                      {file.status === 'complete' && (
                        <div className="mt-2">
                          {file.extractedCount !== undefined && file.extractedCount > 0 ? (
                            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              {file.extractedCount} answers extracted and saved to questionnaire
                            </p>
                          ) : file.error ? (
                            <p className="text-sm text-amber-600 flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4" />
                              {file.error}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              Document uploaded successfully
                            </p>
                          )}
                        </div>
                      )}

                      {/* Error Message */}
                      {file.status === 'error' && (
                        <p className="text-sm text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>

                    {/* Document Type Select (only for pending) */}
                    {file.status === 'pending' && (
                      <Select
                        value={file.documentType}
                        onValueChange={(value) => updateFileType(index, value as DocumentType)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Remove Button (only for pending/error) */}
                    {(file.status === 'pending' || file.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Upload All Button */}
          {pendingCount > 0 && (
            <Button onClick={uploadAllFiles} disabled={isProcessing} className="w-full gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload and Analyze {pendingCount} Document{pendingCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
