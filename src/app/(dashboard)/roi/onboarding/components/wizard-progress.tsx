'use client';

/**
 * Wizard Progress Indicator
 *
 * Visual step indicator for the onboarding wizard
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, type WizardStepId } from '@/lib/roi/onboarding-types';

interface WizardProgressProps {
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  onStepClick?: (step: WizardStepId) => void;
}

export function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
      <div
        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
        style={{
          width: `${((Math.max(...completedSteps, 0)) / (WIZARD_STEPS.length - 1)) * 100}%`,
        }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {WIZARD_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id as WizardStepId);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id as WizardStepId)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-2 group',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'border-primary bg-background text-primary'
                    : 'border-muted bg-background text-muted-foreground',
                  isClickable && !isCurrent && 'group-hover:border-primary/50'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>

              {/* Step label */}
              <div className="text-center max-w-[100px]">
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent
                      ? 'text-foreground'
                      : isCompleted
                      ? 'text-primary'
                      : 'text-muted-foreground',
                    isClickable && 'group-hover:text-foreground'
                  )}
                >
                  {step.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                  ~{step.estimatedMinutes} min
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for mobile
 */
export function WizardProgressCompact({
  currentStep,
  completedSteps,
}: Omit<WizardProgressProps, 'onStepClick'>) {
  const currentStepData = WIZARD_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {WIZARD_STEPS.map((step) => (
          <div
            key={step.id}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              completedSteps.includes(step.id as WizardStepId)
                ? 'bg-primary'
                : currentStep === step.id
                ? 'bg-primary/50'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        Step {currentStep} of {WIZARD_STEPS.length}
        {currentStepData && `: ${currentStepData.name}`}
      </span>
    </div>
  );
}
