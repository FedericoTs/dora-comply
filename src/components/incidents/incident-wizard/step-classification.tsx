'use client';

import { useMemo, useEffect } from 'react';
import { ClassificationCalculator } from '../classification-calculator';
import { calculateClassification } from '@/lib/incidents/validation';
import type { WizardData } from './index';
import type { IncidentClassification } from '@/lib/incidents/types';

interface StepClassificationProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
}

/**
 * Step 3: Classification (Auto-calculated)
 *
 * This step displays the DORA classification calculated from impact data
 * and allows the user to override with justification if needed.
 */
export function StepClassification({ data, updateData, errors }: StepClassificationProps) {
  // Prepare impact data for classification calculation
  const impactData = useMemo(
    () => ({
      clients_affected_percentage: data.clients_affected_percentage,
      transactions_value_affected: data.transactions_value_affected,
      critical_functions_affected: data.critical_functions_affected,
      data_breach: data.data_breach,
      data_records_affected: data.data_records_affected,
    }),
    [
      data.clients_affected_percentage,
      data.transactions_value_affected,
      data.critical_functions_affected,
      data.data_breach,
      data.data_records_affected,
    ]
  );

  // Calculate classification
  const result = useMemo(
    () => calculateClassification(impactData, data.detection_datetime),
    [impactData, data.detection_datetime]
  );

  // Track whether user is overriding
  const isOverride = data.classification_override ?? false;
  const overrideJustification = data.classification_override_justification ?? '';

  // Auto-set calculated classification when not overriding
  useEffect(() => {
    if (!isOverride) {
      // Update both the classification and the calculated classification
      updateData({
        classification: result.calculated,
        classification_calculated: result.calculated,
      });
    }
  }, [isOverride, result.calculated, updateData]);

  // Handle classification change (either from auto-calc or override)
  const handleClassificationChange = (classification: IncidentClassification) => {
    updateData({ classification });
  };

  // Handle override toggle
  const handleOverrideChange = (override: boolean) => {
    if (!override) {
      // When disabling override, reset to calculated classification
      updateData({
        classification_override: false,
        classification: result.calculated,
        classification_override_justification: undefined,
      });
    } else {
      // When enabling override, keep current classification but mark as override
      updateData({
        classification_override: true,
        classification_calculated: result.calculated,
      });
    }
  };

  // Handle justification change
  const handleJustificationChange = (justification: string) => {
    updateData({ classification_override_justification: justification || undefined });
  };

  return (
    <ClassificationCalculator
      impactData={impactData}
      detectionDateTime={data.detection_datetime}
      selectedClassification={data.classification}
      isOverride={isOverride}
      overrideJustification={overrideJustification}
      onClassificationChange={handleClassificationChange}
      onOverrideChange={handleOverrideChange}
      onJustificationChange={handleJustificationChange}
      errors={errors}
    />
  );
}
