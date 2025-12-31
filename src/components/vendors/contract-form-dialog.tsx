'use client';

/**
 * Contract Form Dialog
 *
 * Dialog component for creating/editing vendor contracts
 * Supports optional PDF upload with AI-powered quick scan to auto-populate fields
 */

import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Sparkles, X, CheckCircle2 } from 'lucide-react';
import {
  createContractSchema,
  type CreateContractFormData,
  type Contract,
  CONTRACT_TYPE_INFO,
  CONTRACT_TYPES,
} from '@/lib/contracts';
import { createContract, updateContract } from '@/lib/contracts/actions';
import { cn } from '@/lib/utils';

interface ContractFormDialogProps {
  vendorId: string;
  contract?: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ScanResult {
  documentType: string;
  documentTypeConfidence: number;
  title: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  isIctContract: boolean;
  likelyCriticalFunction: boolean;
  keyServicesMentioned: string[];
  scanNotes: string | null;
}

// Common currencies
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export function ContractFormDialog({
  vendorId,
  contract,
  open,
  onOpenChange,
  onSuccess,
}: ContractFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!contract;

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      vendor_id: vendorId,
      contract_ref: contract?.contract_ref || '',
      contract_type: contract?.contract_type || 'service_agreement',
      signature_date: contract?.signature_date || '',
      effective_date: contract?.effective_date || '',
      expiry_date: contract?.expiry_date || '',
      auto_renewal: contract?.auto_renewal || false,
      termination_notice_days: contract?.termination_notice_days || undefined,
      annual_value: contract?.annual_value || undefined,
      total_value: contract?.total_value || undefined,
      currency: contract?.currency || 'EUR',
      notes: contract?.notes || '',
    },
  });

  // Handle file selection and scanning
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

      // Handle empty or invalid responses
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setScanResult(null);
    setScanError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CreateContractFormData) => {
    setIsLoading(true);

    try {
      if (isEditing && contract) {
        const result = await updateContract(contract.id, {
          contract_ref: data.contract_ref,
          contract_type: data.contract_type,
          signature_date: data.signature_date || null,
          effective_date: data.effective_date,
          expiry_date: data.expiry_date || null,
          auto_renewal: data.auto_renewal,
          termination_notice_days: data.termination_notice_days || null,
          annual_value: data.annual_value || null,
          total_value: data.total_value || null,
          currency: data.currency,
          notes: data.notes || null,
        });

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to update contract');
          return;
        }

        toast.success('Contract updated successfully');
      } else {
        const result = await createContract(data);

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to create contract');
          return;
        }

        toast.success('Contract created successfully');
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Contract form error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        vendor_id: vendorId,
        contract_ref: '',
        contract_type: 'service_agreement',
        signature_date: '',
        effective_date: '',
        expiry_date: '',
        auto_renewal: false,
        termination_notice_days: undefined,
        annual_value: undefined,
        total_value: undefined,
        currency: 'EUR',
        notes: '',
      });
      // Clear file upload state
      setUploadedFile(null);
      setScanResult(null);
      setScanError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (contract) {
      form.reset({
        vendor_id: vendorId,
        contract_ref: contract.contract_ref,
        contract_type: contract.contract_type,
        signature_date: contract.signature_date || '',
        effective_date: contract.effective_date,
        expiry_date: contract.expiry_date || '',
        auto_renewal: contract.auto_renewal,
        termination_notice_days: contract.termination_notice_days || undefined,
        annual_value: contract.annual_value || undefined,
        total_value: contract.total_value || undefined,
        currency: contract.currency,
        notes: contract.notes || '',
      });
    }
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
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
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
                        onClick={clearUploadedFile}
                        disabled={isScanning}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Scan Results Summary */}
                  {scanResult && (
                    <div className="mt-3 pt-3 border-t text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Document Type:</span>
                        <Badge variant="secondary" className="text-xs">
                          {scanResult.documentType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {scanResult.isIctContract && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">ICT Contract:</span>
                          <Badge variant="outline" className="text-xs text-success border-success">
                            Yes - DORA Applicable
                          </Badge>
                        </div>
                      )}
                      {scanResult.likelyCriticalFunction && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Critical Function:</span>
                          <Badge variant="outline" className="text-xs text-warning border-warning">
                            Likely Critical
                          </Badge>
                        </div>
                      )}
                      {scanResult.keyServicesMentioned.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {scanResult.keyServicesMentioned.slice(0, 3).map((service) => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {scanResult.keyServicesMentioned.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{scanResult.keyServicesMentioned.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scan Error */}
                  {scanError && (
                    <p className="mt-2 text-xs text-destructive">{scanError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Contract Reference */}
            <div className="space-y-2">
              <Label htmlFor="contract_ref">
                Contract Reference <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contract_ref"
                placeholder="CT-2025-001"
                {...form.register('contract_ref')}
              />
              {form.formState.errors.contract_ref && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contract_ref.message}
                </p>
              )}
            </div>

            {/* Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select
                value={form.watch('contract_type')}
                onValueChange={(value) =>
                  form.setValue('contract_type', value as CreateContractFormData['contract_type'])
                }
              >
                <SelectTrigger id="contract_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONTRACT_TYPE_INFO[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signature_date">Signature Date</Label>
              <Input
                id="signature_date"
                type="date"
                {...form.register('signature_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">
                Effective Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="effective_date"
                type="date"
                {...form.register('effective_date')}
              />
              {form.formState.errors.effective_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.effective_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                {...form.register('expiry_date')}
              />
              {form.formState.errors.expiry_date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.expiry_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Renewal Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div>
                <Label htmlFor="auto_renewal">Auto Renewal</Label>
                <p className="text-xs text-muted-foreground">
                  Contract renews automatically
                </p>
              </div>
              <Switch
                id="auto_renewal"
                checked={form.watch('auto_renewal')}
                onCheckedChange={(checked) => form.setValue('auto_renewal', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termination_notice_days">
                Termination Notice (days)
              </Label>
              <Input
                id="termination_notice_days"
                type="number"
                min="0"
                max="365"
                placeholder="90"
                {...form.register('termination_notice_days', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Financial */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_value">Annual Value</Label>
              <Input
                id="annual_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="50000"
                {...form.register('annual_value', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_value">Total Value</Label>
              <Input
                id="total_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="150000"
                {...form.register('total_value', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this contract..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

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
