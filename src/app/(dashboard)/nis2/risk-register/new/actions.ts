'use server';

/**
 * Server Actions for NIS2 Risk Creation
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createRiskSchema } from '@/lib/nis2/schema';
import { createRisk } from '@/lib/nis2/queries';
import type { NIS2Category } from '@/lib/compliance/nis2-types';
import type { LikelihoodScore, ImpactScore, TreatmentStrategy } from '@/lib/nis2/types';

export interface ActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createRiskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Parse form data
  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    category: formData.get('category') as string,
    likelihood_score: parseInt(formData.get('likelihood_score') as string, 10),
    impact_score: parseInt(formData.get('impact_score') as string, 10),
    treatment_strategy: formData.get('treatment_strategy') as string || undefined,
    treatment_plan: formData.get('treatment_plan') as string || undefined,
    treatment_due_date: formData.get('treatment_due_date') as string || undefined,
    tolerance_threshold: parseInt(formData.get('tolerance_threshold') as string, 10) || 9,
  };

  // Clean up empty strings
  const cleanedData = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => v !== '' && v !== undefined)
  );

  // Validate
  const result = createRiskSchema.safeParse(cleanedData);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: 'Please fix the validation errors',
      fieldErrors,
    };
  }

  // Create risk - build input with proper types
  const riskInput = {
    title: result.data.title,
    description: result.data.description ?? null,
    category: result.data.category as NIS2Category,
    likelihood_score: result.data.likelihood_score as LikelihoodScore,
    impact_score: result.data.impact_score as ImpactScore,
    owner_id: result.data.owner_id ?? null,
    treatment_strategy: (result.data.treatment_strategy as TreatmentStrategy) ?? null,
    treatment_plan: result.data.treatment_plan ?? null,
    treatment_due_date: result.data.treatment_due_date || null,
    treatment_owner_id: result.data.treatment_owner_id ?? null,
    tolerance_threshold: result.data.tolerance_threshold ?? 9,
    // Initialize status and other optional fields
    status: 'identified' as const,
    review_date: null,
    last_assessed_at: null,
    residual_likelihood: null,
    residual_impact: null,
    residual_risk_score: null,
    residual_risk_level: null,
    combined_control_effectiveness: null,
    is_within_tolerance: null,
    created_by: null,
  };

  const createResult = await createRisk(riskInput);

  if (createResult.error) {
    return {
      success: false,
      error: createResult.error,
    };
  }

  // Revalidate and redirect
  revalidatePath('/nis2/risk-register');
  revalidatePath('/nis2/heat-map');
  redirect('/nis2/risk-register');
}
