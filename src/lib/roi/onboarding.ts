/**
 * RoI Onboarding Wizard
 *
 * Re-exports types and server actions for onboarding
 *
 * Note: For client components, import types from './onboarding-types'
 * and actions from './onboarding-actions'
 */

// Re-export types (client-safe)
export {
  WIZARD_STEPS,
  type WizardStepId,
  type OnboardingProgress,
  type OnboardingStepData,
} from './onboarding-types';

// Re-export server actions
export {
  getOnboardingProgress,
  updateOnboardingStep,
  navigateToStep,
  getStepValidation,
  completeOnboarding,
  resetOnboarding,
} from './onboarding-actions';
