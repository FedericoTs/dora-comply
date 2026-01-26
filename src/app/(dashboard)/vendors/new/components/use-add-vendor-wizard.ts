'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createVendorSchema, type CreateVendorFormData, type CreateVendorFormInput } from '@/lib/vendors/schemas';
import { createVendor } from '@/lib/vendors/actions';
import { validateLEI, searchEntities } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';
import { WIZARD_STEPS } from './types';

export function useAddVendorWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingLei, setIsSearchingLei] = useState(false);
  const [leiSuggestions, setLeiSuggestions] = useState<GLEIFEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<GLEIFEntity | null>(null);

  const form = useForm<CreateVendorFormInput, unknown, CreateVendorFormData>({
    resolver: zodResolver(createVendorSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      lei: '',
      tier: 'standard',
      provider_type: undefined,
      headquarters_country: '',
      service_types: [],
      supports_critical_function: false,
      critical_functions: [],
      is_intra_group: false,
      notes: '',
    },
  });

  // LEI Lookup by code
  const handleLeiLookup = useCallback(async () => {
    const lei = form.getValues('lei');
    if (!lei || lei.length !== 20) {
      toast.error('Please enter a valid 20-character LEI');
      return;
    }

    setIsSearchingLei(true);
    const result = await validateLEI(lei);
    setIsSearchingLei(false);

    if (result.valid && result.entity) {
      setSelectedEntity(result.entity);
      form.setValue('name', result.entity.legalName);
      form.setValue('headquarters_country', result.entity.legalAddress.country);
      toast.success('Entity found and details auto-filled');
    } else {
      toast.error(result.error || 'LEI not found');
    }
  }, [form]);

  // Name search for LEI suggestions
  const handleNameSearch = useCallback(async () => {
    const name = form.getValues('name');
    if (!name || name.length < 3) return;

    setIsSearchingLei(true);
    const result = await searchEntities(name, 5);
    setIsSearchingLei(false);

    if (result.results.length > 0) {
      setLeiSuggestions(result.results);
    } else {
      setLeiSuggestions([]);
    }
  }, [form]);

  // Select entity from suggestions
  const handleSelectEntity = useCallback((entity: GLEIFEntity) => {
    setSelectedEntity(entity);
    form.setValue('name', entity.legalName);
    form.setValue('lei', entity.lei);
    form.setValue('headquarters_country', entity.legalAddress.country);
    setLeiSuggestions([]);
  }, [form]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setLeiSuggestions([]);
  }, []);

  // Navigation with validation (2-step wizard)
  const nextStep = useCallback(async () => {
    const stepFields: Record<number, (keyof CreateVendorFormInput)[]> = {
      1: ['name'],
      2: ['tier'], // Only tier is required in Risk Profile step
    };

    const fieldsToValidate = stepFields[currentStep] || [];
    const isValid = await form.trigger(fieldsToValidate);

    if (!isValid) {
      toast.error('Please complete required fields before continuing');
      return;
    }

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, form]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Form submission
  const onSubmit = useCallback(async (data: CreateVendorFormData) => {
    setIsSubmitting(true);
    const result = await createVendor(data);
    setIsSubmitting(false);

    if (result.success && result.data) {
      toast.success(`${result.data.name} has been added`);

      if (result.roiPopulated) {
        setTimeout(() => {
          toast.info('Vendor added to RoI Register of ICT Providers (B_05.01)', {
            description: 'View in Register of Information dashboard',
            action: {
              label: 'View RoI',
              onClick: () => router.push('/roi'),
            },
          });
        }, 500);
      }

      router.push(`/vendors/${result.data.id}`);
    } else {
      toast.error(result.error?.message || 'Failed to create vendor');
    }
  }, [router]);

  return {
    // State
    currentStep,
    isSubmitting,
    isSearchingLei,
    leiSuggestions,
    selectedEntity,
    form,
    totalSteps: WIZARD_STEPS.length,
    // Actions
    handleLeiLookup,
    handleNameSearch,
    handleSelectEntity,
    clearSuggestions,
    nextStep,
    prevStep,
    onSubmit,
  };
}
