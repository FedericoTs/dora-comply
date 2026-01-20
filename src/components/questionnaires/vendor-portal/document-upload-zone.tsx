'use client';

/**
 * DocumentUploadZone Component
 *
 * Drag-and-drop file upload for vendor portal
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  documentType: DocumentType;
  error?: string;
}

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'soc2', label: 'SOC 2 Report' },
  { value: 'iso27001', label: 'ISO 27001 Certificate' },
  { value: 'policy', label: 'Security Policy' },
  { value: 'certificate', label: 'Other Certification' },
  { value: 'other', label: 'Other Document' },
];

export function DocumentUploadZone({
  token,
  existingDocuments,
  onUploadComplete,
}: DocumentUploadZoneProps) {
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

  async function uploadFile(file: UploadingFile, index: number) {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 10 } : f))
    );

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('document_type', file.documentType);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Upload to API
      const response = await fetch(`/api/vendor-portal/${token}/documents`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'processing', progress: 95 } : f
        )
      );

      // Wait a bit for processing indication
      await new Promise((r) => setTimeout(r, 1000));

      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'complete', progress: 100 } : f
        )
      );

      toast.success(`${file.file.name} uploaded successfully`);
      onUploadComplete?.();
    } catch (error) {
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: 'error', error: 'Upload failed. Please try again.' }
            : f
        )
      );
      toast.error(`Failed to upload ${file.file.name}`);
    }
  }

  async function uploadAllFiles() {
    const pendingFiles = uploadingFiles.filter((f) => f.status === 'pending');
    for (let i = 0; i < uploadingFiles.length; i++) {
      if (uploadingFiles[i].status === 'pending') {
        await uploadFile(uploadingFiles[i], i);
      }
    }
  }

  const pendingCount = uploadingFiles.filter((f) => f.status === 'pending').length;
  const hasUploading = uploadingFiles.some((f) => f.status === 'uploading' || f.status === 'processing');

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed cursor-pointer transition-colors',
          isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <CardContent className="p-8">
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Upload className={cn('h-6 w-6', isDragActive ? 'text-emerald-600' : 'text-gray-400')} />
            </div>
            <p className="text-gray-900 font-medium">
              {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">PDF files up to 50MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((file, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {file.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : file.status === 'uploading' || file.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>

                    {/* Progress Bar */}
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-1.5" />
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === 'processing' ? 'Processing...' : 'Uploading...'}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === 'error' && (
                      <p className="text-sm text-destructive mt-1">{file.error}</p>
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
          ))}

          {/* Upload All Button */}
          {pendingCount > 0 && (
            <Button onClick={uploadAllFiles} disabled={hasUploading} className="w-full">
              {hasUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {pendingCount} File{pendingCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
