'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  type DocumentType,
  DOCUMENT_TYPE_INFO,
  formatFileSize,
} from '@/lib/documents/types';
import { uploadDocument } from '@/lib/documents/actions';
import { ACCEPTED_FILE_TYPES } from './constants';

interface SimpleVendor {
  id: string;
  name: string;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: SimpleVendor[];
  isLoadingVendors: boolean;
  onUploadSuccess: () => void;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  vendors,
  isLoadingVendors,
  onUploadSuccess,
}: UploadDocumentDialogProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocumentType>('other');
  const [uploadVendorId, setUploadVendorId] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    if (!uploadVendorId) {
      toast.error('Please select a vendor');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', uploadType);
      formData.append('vendor_id', uploadVendorId);
      formData.append('metadata', JSON.stringify({ description: uploadDescription }));

      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success('Document uploaded successfully');
        handleClose();
        onUploadSuccess();
      } else {
        toast.error(result.error?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setUploadFile(null);
    setUploadType('other');
    setUploadVendorId('');
    setUploadDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload compliance documents, certificates, or audit reports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label>File</Label>
            {uploadFile ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to select
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select File
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Word, Excel, Images up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Vendor (Required) */}
          <div className="space-y-2">
            <Label>
              Vendor <span className="text-destructive">*</span>
            </Label>
            {isLoadingVendors ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading vendors...
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                <p className="mb-2">No vendors found.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/vendors/new">Add your first vendor</Link>
                </Button>
              </div>
            ) : (
              <Select value={uploadVendorId} onValueChange={setUploadVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Documents must be linked to a vendor for compliance tracking and RoI population.
            </p>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={uploadType} onValueChange={(v) => setUploadType(v as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add a description..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!uploadFile || !uploadVendorId || isUploading || vendors.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
