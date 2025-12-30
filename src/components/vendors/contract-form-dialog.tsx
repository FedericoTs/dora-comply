'use client';

/**
 * Contract Form Dialog
 *
 * Dialog component for creating/editing vendor contracts
 */

import { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  createContractSchema,
  type CreateContractFormData,
  type Contract,
  CONTRACT_TYPE_INFO,
  CONTRACT_TYPES,
} from '@/lib/contracts';
import { createContract, updateContract } from '@/lib/contracts/actions';

interface ContractFormDialogProps {
  vendorId: string;
  contract?: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
