'use client';

import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS } from './types';

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {WIZARD_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'flex items-center gap-3',
              currentStep === step.id && 'text-foreground',
              currentStep !== step.id && 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                currentStep > step.id && 'border-primary bg-primary text-primary-foreground',
                currentStep === step.id && 'border-primary bg-background',
                currentStep < step.id && 'border-muted bg-muted'
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}
