'use client';

import { UseFormReturn } from 'react-hook-form';
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
import {
  type CreateContractFormData,
  CONTRACT_TYPE_INFO,
  CONTRACT_TYPES,
} from '@/lib/contracts';
import { CURRENCIES } from './types';

interface ContractFieldsProps {
  form: UseFormReturn<CreateContractFormData>;
}

export function ContractRefAndTypeFields({ form }: ContractFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
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
  );
}

export function DateFields({ form }: ContractFieldsProps) {
  return (
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
  );
}

export function RenewalFields({ form }: ContractFieldsProps) {
  return (
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
  );
}

export function FinancialFields({ form }: ContractFieldsProps) {
  return (
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
  );
}

export function NotesField({ form }: ContractFieldsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        placeholder="Additional notes about this contract..."
        rows={3}
        {...form.register('notes')}
      />
    </div>
  );
}
