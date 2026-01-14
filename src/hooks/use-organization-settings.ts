'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  organizationSchema,
  type OrganizationFormData,
  type LEIValidationResult,
  EU_JURISDICTIONS,
  DEFAULT_FORM_VALUES,
} from '@/lib/settings/organization-constants';

export function useOrganizationSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leiValidation, setLeiValidation] = useState<LEIValidationResult | null>(null);
  const [isValidatingLei, setIsValidatingLei] = useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // Watch fields for conditional rendering
  const significanceLevel = form.watch('significanceLevel');
  const entityType = form.watch('entityType');

  // LEI validation function
  const validateLEI = useCallback(async (lei: string) => {
    if (!lei || lei.length !== 20) {
      setLeiValidation(null);
      return;
    }

    setIsValidatingLei(true);
    try {
      const response = await fetch(`/api/gleif/validate?lei=${encodeURIComponent(lei)}`);
      const data = await response.json();
      setLeiValidation(data);

      // Auto-fill form fields if validation successful
      if (data.valid && data.entity) {
        const currentName = form.getValues('name');
        const currentJurisdiction = form.getValues('jurisdiction');

        // Only auto-fill if fields are empty or match existing data
        if (!currentName || currentName === data.entity.legalName) {
          form.setValue('name', data.entity.legalName);
        }

        if (data.entity.jurisdiction) {
          const countryCode = data.entity.legalAddress.country;
          if (!currentJurisdiction || currentJurisdiction === 'EU') {
            const matchingJurisdiction = EU_JURISDICTIONS.find((j) => j.code === countryCode);
            if (matchingJurisdiction) {
              form.setValue('jurisdiction', countryCode);
            }
          }
        }
      }
    } catch (error) {
      console.error('LEI validation error:', error);
      setLeiValidation({ valid: false, error: 'Failed to validate LEI' });
    } finally {
      setIsValidatingLei(false);
    }
  }, [form]);

  // Debounced LEI validation
  const handleLeiChange = useCallback((value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    form.setValue('lei', normalized);

    if (normalized.length === 20) {
      validateLEI(normalized);
    } else {
      setLeiValidation(null);
    }
  }, [form, validateLEI]);

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      try {
        const response = await fetch('/api/settings/organization');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Determine significance level from flags
            let sigLevel: 'significant' | 'non_significant' | 'simplified' = 'non_significant';
            if (data.data.simplified_framework_eligible) {
              sigLevel = 'simplified';
            } else if (data.data.is_significant) {
              sigLevel = 'significant';
            }

            form.reset({
              name: data.data.name || '',
              lei: data.data.lei || '',
              entityType: data.data.entity_type || 'financial_entity',
              jurisdiction: data.data.jurisdiction || 'EU',
              significanceLevel: sigLevel,
              significanceRationale: data.data.significance_rationale || '',
              employeeCount: data.data.employee_count || '',
              totalAssetsEur: data.data.total_assets_eur || '',
              annualGrossPremiumEur: data.data.annual_gross_premium_eur || '',
            });

            // If LEI exists, validate it
            if (data.data.lei) {
              validateLEI(data.data.lei);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
        toast.error('Failed to load organization settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganization();
  }, [form, validateLEI]);

  // Save organization
  async function onSubmit(data: OrganizationFormData) {
    setIsSaving(true);
    try {
      // Parse string numbers to actual numbers, or null if empty
      const parseNumber = (val: string | undefined): number | null => {
        if (!val || val.trim() === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          lei: data.lei || null,
          entity_type: data.entityType,
          jurisdiction: data.jurisdiction,
          // Classification fields
          is_significant: data.significanceLevel === 'significant',
          simplified_framework_eligible: data.significanceLevel === 'simplified',
          significance_rationale: data.significanceLevel === 'significant' ? data.significanceRationale : null,
          employee_count: parseNumber(data.employeeCount),
          total_assets_eur: parseNumber(data.totalAssetsEur),
          annual_gross_premium_eur: parseNumber(data.annualGrossPremiumEur),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Organization settings saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save organization settings');
    } finally {
      setIsSaving(false);
    }
  }

  const handleReset = () => form.reset();

  const triggerLeiValidation = () => {
    const lei = form.getValues('lei');
    if (lei) validateLEI(lei);
  };

  return {
    // Form
    form,

    // State
    isLoading,
    isSaving,
    leiValidation,
    isValidatingLei,
    significanceLevel,
    entityType,

    // Handlers
    onSubmit,
    handleLeiChange,
    handleReset,
    triggerLeiValidation,
  };
}
