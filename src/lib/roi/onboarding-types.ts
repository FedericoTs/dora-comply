/**
 * RoI Onboarding Types & Constants
 *
 * Client-safe types and constants for onboarding wizard
 */

// Wizard step definitions
export const WIZARD_STEPS = [
  {
    id: 1,
    name: 'Entity Information',
    description: 'Set up your organization details for the Register',
    template: 'B_01.01',
    estimatedMinutes: 10,
  },
  {
    id: 2,
    name: 'ICT Providers',
    description: 'Add your third-party ICT service providers',
    template: 'B_02.01',
    estimatedMinutes: 15,
  },
  {
    id: 3,
    name: 'Contractual Arrangements',
    description: 'Link providers to contracts and services',
    template: 'B_03.01',
    estimatedMinutes: 20,
  },
  {
    id: 4,
    name: 'Critical Functions',
    description: 'Map ICT services to business functions',
    template: 'B_04.01',
    estimatedMinutes: 15,
  },
  {
    id: 5,
    name: 'Review & Complete',
    description: 'Review your setup and start using the RoI',
    template: null,
    estimatedMinutes: 5,
  },
] as const;

export type WizardStepId = 1 | 2 | 3 | 4 | 5;

export interface OnboardingProgress {
  id: string;
  organizationId: string;
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  isComplete: boolean;
  startedAt: Date;
  completedAt: Date | null;
  lastActivityAt: Date;
}

export interface OnboardingStepData {
  stepId: WizardStepId;
  isCompleted: boolean;
  canProceed: boolean;
  validationErrors: string[];
  itemCount: number; // Number of items added in this step
}
