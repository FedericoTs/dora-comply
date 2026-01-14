'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  isSubmitting,
  onPrevious,
  onNext,
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
      >
        Previous
      </Button>

      {isLastStep ? (
        <Button type="submit" loading={isSubmitting}>
          Create Vendor
        </Button>
      ) : (
        <Button type="button" onClick={onNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
