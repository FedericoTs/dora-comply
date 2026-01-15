'use client';

/**
 * useIncidentEditForm Hook
 *
 * Manages incident edit form state, classification calculation, and submission.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateIncidentAction } from '@/lib/incidents/actions';
import { calculateClassification } from '@/lib/incidents/validation';
import type {
  Incident,
  UpdateIncidentInput,
  IncidentClassification,
  ClassificationResult,
  ImpactData,
} from '@/lib/incidents/types';

export interface UseIncidentEditFormProps {
  incident: Incident;
}

export interface UseIncidentEditFormReturn {
  // Form state
  formData: Partial<UpdateIncidentInput>;
  activeTab: string;
  hasChanges: boolean;
  isSubmitting: boolean;

  // Derived data
  impactData: ImpactData;
  classificationResult: ClassificationResult;

  // Actions
  setActiveTab: (tab: string) => void;
  updateFormData: (updates: Partial<UpdateIncidentInput>) => void;
  handleClassificationChange: (classification: IncidentClassification) => void;
  handleOverrideChange: (isOverride: boolean) => void;
  handleJustificationChange: (justification: string) => void;
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
}

export function useIncidentEditForm({ incident }: UseIncidentEditFormProps): UseIncidentEditFormReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // Form state - convert null values to undefined for type compatibility
  const [formData, setFormData] = useState<Partial<UpdateIncidentInput>>({
    title: incident.title,
    description: incident.description ?? undefined,
    incident_type: incident.incident_type,
    detection_datetime: incident.detection_datetime,
    occurrence_datetime: incident.occurrence_datetime ?? undefined,
    services_affected: incident.services_affected || [],
    critical_functions_affected: incident.critical_functions_affected || [],
    clients_affected_count: incident.clients_affected_count ?? undefined,
    clients_affected_percentage: incident.clients_affected_percentage ?? undefined,
    transactions_affected_count: incident.transactions_affected_count ?? undefined,
    transactions_value_affected: incident.transactions_value_affected ?? undefined,
    data_breach: incident.data_breach || false,
    data_records_affected: incident.data_records_affected ?? undefined,
    geographic_spread: incident.geographic_spread || [],
    economic_impact: incident.economic_impact ?? undefined,
    reputational_impact: incident.reputational_impact ?? undefined,
    classification: incident.classification,
    classification_override: incident.classification_override || false,
    classification_override_justification: incident.classification_override_justification ?? undefined,
    vendor_id: incident.vendor_id ?? undefined,
    root_cause: incident.root_cause ?? undefined,
    remediation_actions: incident.remediation_actions ?? undefined,
    status: incident.status,
  });

  // Calculate classification based on current impact data
  const impactData = useMemo(
    () => ({
      clients_affected_percentage: formData.clients_affected_percentage,
      transactions_value_affected: formData.transactions_value_affected,
      critical_functions_affected: formData.critical_functions_affected,
      data_breach: formData.data_breach,
      data_records_affected: formData.data_records_affected,
    }),
    [
      formData.clients_affected_percentage,
      formData.transactions_value_affected,
      formData.critical_functions_affected,
      formData.data_breach,
      formData.data_records_affected,
    ]
  );

  const classificationResult = useMemo(
    () => calculateClassification(impactData, formData.detection_datetime),
    [impactData, formData.detection_datetime]
  );

  // Update form data
  const updateFormData = useCallback((updates: Partial<UpdateIncidentInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Handle classification change
  const handleClassificationChange = useCallback(
    (classification: IncidentClassification) => {
      updateFormData({ classification });
    },
    [updateFormData]
  );

  // Handle override change
  const handleOverrideChange = useCallback(
    (isOverride: boolean) => {
      if (!isOverride) {
        updateFormData({
          classification_override: false,
          classification: classificationResult.calculated,
          classification_override_justification: undefined,
        });
      } else {
        updateFormData({
          classification_override: true,
        });
      }
    },
    [updateFormData, classificationResult.calculated]
  );

  // Handle justification change
  const handleJustificationChange = useCallback(
    (justification: string) => {
      updateFormData({
        classification_override_justification: justification || undefined,
      });
    },
    [updateFormData]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Prepare data for update
      const updateData: UpdateIncidentInput = {
        ...formData,
        // If not overriding, use calculated classification
        classification: formData.classification_override
          ? formData.classification
          : classificationResult.calculated,
        classification_calculated: classificationResult.calculated,
      };

      const result = await updateIncidentAction(incident.id, updateData);

      if (result.success) {
        toast.success('Incident updated successfully');
        setHasChanges(false);
        router.push(`/incidents/${incident.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update incident');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, classificationResult.calculated, incident.id, router]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/incidents/${incident.id}`);
  }, [router, incident.id]);

  return {
    // Form state
    formData,
    activeTab,
    hasChanges,
    isSubmitting,

    // Derived data
    impactData,
    classificationResult,

    // Actions
    setActiveTab,
    updateFormData,
    handleClassificationChange,
    handleOverrideChange,
    handleJustificationChange,
    handleSubmit,
    handleCancel,
  };
}
