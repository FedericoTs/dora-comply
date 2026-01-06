'use server';

/**
 * RoI Onboarding Server Actions
 *
 * Server-side functions for onboarding wizard operations
 */

import { createClient } from '@/lib/supabase/server';
import type { WizardStepId, OnboardingProgress, OnboardingStepData } from './onboarding-types';

/**
 * Get or create onboarding progress for current organization
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: progress, error } = await supabase
    .from('roi_onboarding_progress')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching onboarding progress:', error);
    return null;
  }

  if (!progress) {
    // Create new progress record
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!orgMember) return null;

    const { data: newProgress, error: createError } = await supabase
      .from('roi_onboarding_progress')
      .insert({
        organization_id: orgMember.organization_id,
        current_step: 1,
        completed_steps: [],
        is_complete: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating onboarding progress:', createError);
      return null;
    }

    return transformProgress(newProgress);
  }

  return transformProgress(progress);
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(
  stepId: WizardStepId,
  markComplete: boolean = false
): Promise<OnboardingProgress | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('roi_onboarding_progress')
    .select('*')
    .single();

  if (!current) return null;

  const completedSteps = [...(current.completed_steps || [])];
  if (markComplete && !completedSteps.includes(stepId)) {
    completedSteps.push(stepId);
  }

  const isComplete = completedSteps.length === 5;

  const { data: updated, error } = await supabase
    .from('roi_onboarding_progress')
    .update({
      current_step: stepId,
      completed_steps: completedSteps,
      is_complete: isComplete,
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq('id', current.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating onboarding step:', error);
    return null;
  }

  return transformProgress(updated);
}

/**
 * Skip to a specific step (for users who want to go back)
 */
export async function navigateToStep(stepId: WizardStepId): Promise<OnboardingProgress | null> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('roi_onboarding_progress')
    .update({
      current_step: stepId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error navigating to step:', error);
    return null;
  }

  return transformProgress(updated);
}

/**
 * Get step validation data
 */
export async function getStepValidation(stepId: WizardStepId): Promise<OnboardingStepData> {
  const supabase = await createClient();

  const baseResult: OnboardingStepData = {
    stepId,
    isCompleted: false,
    canProceed: false,
    validationErrors: [],
    itemCount: 0,
  };

  switch (stepId) {
    case 1: {
      // Entity step - check if organization has required fields
      const { data: org } = await supabase
        .from('organizations')
        .select('name, legal_name, lei_code, country')
        .single();

      if (org) {
        const errors: string[] = [];
        if (!org.legal_name) errors.push('Legal name is required');
        if (!org.lei_code) errors.push('LEI code is required for DORA reporting');
        if (!org.country) errors.push('Country of registration is required');

        return {
          ...baseResult,
          isCompleted: errors.length === 0,
          canProceed: true, // Can proceed even with warnings
          validationErrors: errors,
          itemCount: 1,
        };
      }
      break;
    }
    case 2: {
      // Vendors step - check if at least one vendor exists
      const { count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      return {
        ...baseResult,
        isCompleted: (count || 0) > 0,
        canProceed: true,
        validationErrors: count === 0 ? ['Add at least one ICT provider to continue'] : [],
        itemCount: count || 0,
      };
    }
    case 3: {
      // Contracts step - check if vendors have contracts
      const { data: vendorsWithContracts } = await supabase
        .from('vendors')
        .select('id, contracts:contracts(id)')
        .not('contracts', 'is', null);

      const withContracts = vendorsWithContracts?.filter(v => v.contracts?.length > 0) || [];

      return {
        ...baseResult,
        isCompleted: withContracts.length > 0,
        canProceed: true,
        validationErrors: withContracts.length === 0
          ? ['Link at least one vendor to a contract']
          : [],
        itemCount: withContracts.length,
      };
    }
    case 4: {
      // Functions step - check if critical functions are mapped
      const { count } = await supabase
        .from('critical_functions')
        .select('*', { count: 'exact', head: true });

      return {
        ...baseResult,
        isCompleted: (count || 0) > 0,
        canProceed: true,
        validationErrors: count === 0
          ? ['Map at least one critical or important function']
          : [],
        itemCount: count || 0,
      };
    }
    case 5: {
      // Review step - always can complete
      return {
        ...baseResult,
        isCompleted: false,
        canProceed: true,
        validationErrors: [],
        itemCount: 0,
      };
    }
  }

  return baseResult;
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('roi_onboarding_progress')
    .update({
      is_complete: true,
      completed_at: new Date().toISOString(),
      completed_steps: [1, 2, 3, 4, 5],
    })
    .eq('is_complete', false);

  return !error;
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboarding(): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('roi_onboarding_progress')
    .update({
      current_step: 1,
      completed_steps: [],
      is_complete: false,
      completed_at: null,
    })
    .select();

  return !error;
}

// Helper to transform database row to typed object
function transformProgress(row: Record<string, unknown>): OnboardingProgress {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    currentStep: row.current_step as WizardStepId,
    completedSteps: (row.completed_steps || []) as WizardStepId[],
    isComplete: row.is_complete as boolean,
    startedAt: new Date(row.started_at as string || row.created_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    lastActivityAt: new Date(row.last_activity_at as string || row.updated_at as string || row.created_at as string),
  };
}
