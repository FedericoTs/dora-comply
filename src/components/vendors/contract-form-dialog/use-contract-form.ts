'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createContractSchema,
  type CreateContractFormData,
  type Contract,
} from '@/lib/contracts';
import { createContract, updateContract } from '@/lib/contracts/actions';

interface UseContractFormProps {
  vendorId: string;
  contract?: Contract | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function useContractForm({
  vendorId,
  contract,
  onOpenChange,
  onSuccess,
}: UseContractFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!contract;

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    mode: 'onTouched',
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

  const onSubmit = useCallback(async (data: CreateContractFormData) => {
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
  }, [isEditing, contract, form, onOpenChange, onSuccess]);

  const resetForm = useCallback((contractData?: Contract | null) => {
    if (contractData) {
      form.reset({
        vendor_id: vendorId,
        contract_ref: contractData.contract_ref,
        contract_type: contractData.contract_type,
        signature_date: contractData.signature_date || '',
        effective_date: contractData.effective_date,
        expiry_date: contractData.expiry_date || '',
        auto_renewal: contractData.auto_renewal,
        termination_notice_days: contractData.termination_notice_days || undefined,
        annual_value: contractData.annual_value || undefined,
        total_value: contractData.total_value || undefined,
        currency: contractData.currency,
        notes: contractData.notes || '',
      });
    } else {
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
    }
  }, [form, vendorId]);

  return {
    form,
    isLoading,
    isEditing,
    onSubmit,
    resetForm,
  };
}
