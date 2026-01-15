'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Sparkles,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  scanDocumentForVendor,
  completeSmartImport,
  type SmartImportScanResult,
} from '@/lib/documents/smart-import';

interface SmartImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'scanning' | 'review' | 'importing' | 'success';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};

const DOCUMENT_TYPES = [
  { value: 'soc2', label: 'SOC 2 Report' },
  { value: 'iso27001', label: 'ISO 27001 Certificate' },
  { value: 'pentest', label: 'Penetration Test Report' },
  { value: 'contract', label: 'Contract / Agreement' },
  { value: 'other', label: 'Other' },
];

const TIER_OPTIONS = [
  { value: 'critical', label: 'Critical', description: 'High risk, critical business functions' },
  { value: 'important', label: 'Important', description: 'Moderate risk, important functions' },
  { value: 'standard', label: 'Standard', description: 'Low risk, general services' },
];

export function SmartImportDialog({ open, onOpenChange }: SmartImportDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<SmartImportScanResult | null>(null);
  const [documentType, setDocumentType] = useState<string>('other');

  // Editable vendor data
  const [vendorName, setVendorName] = useState('');
  const [vendorTier, setVendorTier] = useState<'critical' | 'important' | 'standard'>('standard');
  const [supportsCritical, setSupportsCritical] = useState(false);

  // Result
  const [importResult, setImportResult] = useState<{
    vendorId?: string;
    vendorName?: string;
    roiPopulated?: boolean;
  } | null>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setScanResult(null);
    setDocumentType('other');
    setVendorName('');
    setVendorTier('standard');
    setSupportsCritical(false);
    setImportResult(null);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('scanning');

    // Auto-detect document type from filename
    const fileName = selectedFile.name.toLowerCase();
    if (fileName.includes('soc') || fileName.includes('soc2')) {
      setDocumentType('soc2');
    } else if (fileName.includes('iso') || fileName.includes('27001')) {
      setDocumentType('iso27001');
    } else if (fileName.includes('pentest') || fileName.includes('penetration')) {
      setDocumentType('pentest');
    } else if (fileName.includes('contract') || fileName.includes('agreement')) {
      setDocumentType('contract');
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = await scanDocumentForVendor(buffer, selectedFile.name, selectedFile.type);

      setScanResult(result);

      if (result.success && result.suggestedVendor) {
        setVendorName(result.suggestedVendor.name);
        setSupportsCritical(result.suggestedVendor.supportsCriticalFunction || false);

        // Auto-suggest tier based on critical function
        if (result.suggestedVendor.supportsCriticalFunction) {
          setVendorTier('critical');
        }
      }

      setStep('review');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to analyze document');
      setStep('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleImport = async () => {
    if (!file || !vendorName.trim()) {
      toast.error('Please provide a vendor name');
      return;
    }

    setStep('importing');

    const result = await completeSmartImport(
      file,
      {
        name: vendorName.trim(),
        tier: vendorTier,
        supportsCriticalFunction: supportsCritical,
        providerType: scanResult?.suggestedVendor?.providerType,
        serviceTypes: scanResult?.suggestedVendor?.serviceTypes,
      },
      documentType as 'soc2' | 'iso27001' | 'pentest' | 'contract' | 'other'
    );

    if (result.success) {
      setImportResult({
        vendorId: result.vendorId,
        vendorName: result.vendorName,
        roiPopulated: result.roiPopulated,
      });
      setStep('success');
    } else {
      toast.error(result.error || 'Import failed');
      setStep('review');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(resetState, 300);
  };

  const handleViewVendor = () => {
    if (importResult?.vendorId) {
      router.push(`/vendors/${importResult.vendorId}`);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Import
          </DialogTitle>
          <DialogDescription>
            Upload a document to automatically create a vendor and link the document.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Drop the file here' : 'Drop a document or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              SOC 2 reports, ISO certificates, contracts, or other compliance documents
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word (max 50MB)
            </p>
          </div>
        )}

        {/* Step: Scanning */}
        {step === 'scanning' && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
            <p className="text-sm font-medium mb-1">Analyzing document...</p>
            <p className="text-xs text-muted-foreground">
              Extracting vendor information with AI
            </p>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Document Info */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file && (file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setStep('upload');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Extraction Badge */}
            {scanResult?.scan && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI extracted vendor information
                {scanResult.scan.documentTypeConfidence && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(scanResult.scan.documentTypeConfidence * 100)}% confidence
                  </Badge>
                )}
              </div>
            )}

            {/* Vendor Name */}
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Vendor Name *</Label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Tier */}
            <div className="space-y-2">
              <Label>Vendor Tier</Label>
              <Select value={vendorTier} onValueChange={(v) => setVendorTier(v as typeof vendorTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      <div>
                        <span className="font-medium">{tier.label}</span>
                        <span className="text-muted-foreground ml-2">- {tier.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Critical Function */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="critical-function"
                checked={supportsCritical}
                onCheckedChange={(checked) => setSupportsCritical(checked as boolean)}
              />
              <Label htmlFor="critical-function" className="text-sm font-normal">
                Supports critical or important function (DORA)
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleImport} disabled={!vendorName.trim()}>
                <Building2 className="h-4 w-4 mr-2" />
                Create Vendor & Import
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
            <p className="text-sm font-medium mb-1">Creating vendor and uploading document...</p>
            <p className="text-xs text-muted-foreground">
              This will only take a moment
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && importResult && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{importResult.vendorName}</p>
              <p className="text-sm text-muted-foreground">
                Vendor created and document uploaded successfully
              </p>
            </div>

            {importResult.roiPopulated && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Added to RoI Register of ICT Providers
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleViewVendor}>
                View Vendor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
