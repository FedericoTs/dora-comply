'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, type WizardStep } from './types';

interface WizardProgressProps {
  currentStep: WizardStep;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const visibleSteps = WIZARD_STEPS.slice(0, -2); // Exclude 'importing' and 'complete'

  return (
    <div className="flex items-center gap-2 py-2">
      {visibleSteps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              stepIndex > i
                ? 'bg-primary text-primary-foreground'
                : stepIndex === i
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {stepIndex > i ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < visibleSteps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-1',
                stepIndex > i ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
