'use client';

/**
 * Branding Settings Hook
 * Manages state and operations for organization branding customization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  type OrganizationBranding,
  type BrandingFormData,
  brandingSchema,
  DEFAULT_BRANDING,
} from '@/lib/settings/branding-types';
import {
  getOrganizationBranding,
  updateOrganizationBranding,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
} from '@/lib/settings/branding';

interface UseBrandingSettingsReturn {
  form: UseFormReturn<BrandingFormData>;
  isLoading: boolean;
  isSaving: boolean;
  isUploadingLogo: boolean;
  isDeletingLogo: boolean;
  logoUrl: string | null;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleLogoUpload: (file: File) => Promise<void>;
  handleLogoDelete: () => Promise<void>;
  handleReset: () => void;
  applyColorPreset: (primary: string, accent: string) => void;
}

export function useBrandingSettings(): UseBrandingSettingsReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: DEFAULT_BRANDING.primaryColor,
      accentColor: DEFAULT_BRANDING.accentColor,
      portalWelcomeTitle: DEFAULT_BRANDING.portalWelcomeTitle,
      portalWelcomeMessage: DEFAULT_BRANDING.portalWelcomeMessage,
      portalFooterText: null,
      portalSupportEmail: null,
      portalLogoPosition: DEFAULT_BRANDING.portalLogoPosition,
    },
  });

  // Load branding settings
  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getOrganizationBranding();
      if (result.success && result.data) {
        const branding = result.data;
        setLogoUrl(branding.logoUrl);
        form.reset({
          primaryColor: branding.primaryColor,
          accentColor: branding.accentColor,
          portalWelcomeTitle: branding.portalWelcomeTitle,
          portalWelcomeMessage: branding.portalWelcomeMessage,
          portalFooterText: branding.portalFooterText,
          portalSupportEmail: branding.portalSupportEmail,
          portalLogoPosition: branding.portalLogoPosition,
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  // Save branding settings
  const onSubmit = async (data: BrandingFormData) => {
    setIsSaving(true);
    try {
      const result = await updateOrganizationBranding(data);
      if (result.success) {
        toast.success('Branding settings saved');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload logo
  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const result = await uploadOrganizationLogo(formData);
      if (result.success && result.logoUrl) {
        setLogoUrl(result.logoUrl);
        toast.success('Logo uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Delete logo
  const handleLogoDelete = async () => {
    setIsDeletingLogo(true);
    try {
      const result = await deleteOrganizationLogo();
      if (result.success) {
        setLogoUrl(null);
        toast.success('Logo removed');
      } else {
        toast.error(result.error || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeletingLogo(false);
    }
  };

  // Reset form
  const handleReset = () => {
    loadBranding();
    toast.info('Settings reset to saved values');
  };

  // Apply color preset
  const applyColorPreset = (primary: string, accent: string) => {
    form.setValue('primaryColor', primary);
    form.setValue('accentColor', accent);
  };

  // Wrap form submission to prevent type issues across component boundaries
  const handleSubmit = form.handleSubmit(onSubmit);

  return {
    form,
    isLoading,
    isSaving,
    isUploadingLogo,
    isDeletingLogo,
    logoUrl,
    handleSubmit,
    handleLogoUpload,
    handleLogoDelete,
    handleReset,
    applyColorPreset,
  };
}
