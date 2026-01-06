'use client';

/**
 * RoI Onboarding Wizard Page
 *
 * Guided setup for Register of Information
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WizardProgress, WizardProgressCompact } from './components/wizard-progress';
import { EntityStep } from './components/entity-step';
import { VendorsStep } from './components/vendors-step';
import { ServicesStep } from './components/services-step';
import { FunctionsStep } from './components/functions-step';
import { ReviewStep } from './components/review-step';
import {
  WIZARD_STEPS,
  type WizardStepId,
  type OnboardingProgress,
  type OnboardingStepData,
} from '@/lib/roi/onboarding-types';
import {
  getOnboardingProgress,
  updateOnboardingStep,
  getStepValidation,
  completeOnboarding,
} from '@/lib/roi/onboarding-actions';

export default function RoiOnboardingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [stepValidation, setStepValidation] = useState<OnboardingStepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding progress
  useEffect(() => {
    async function loadProgress() {
      const savedProgress = await getOnboardingProgress();
      if (savedProgress) {
        setProgress(savedProgress);
        setCurrentStep(savedProgress.currentStep);
      }
      setIsLoading(false);
    }
    loadProgress();
  }, []);

  // Load step validation when step changes
  useEffect(() => {
    async function loadValidation() {
      const validation = await getStepValidation(currentStep);
      setStepValidation(validation);
    }
    loadValidation();
  }, [currentStep]);

  const handleStepClick = useCallback(async (stepId: WizardStepId) => {
    setCurrentStep(stepId);
    await updateOnboardingStep(stepId, false);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      const newStep = (currentStep - 1) as WizardStepId;
      setCurrentStep(newStep);
      updateOnboardingStep(newStep, false);
    }
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (currentStep < 5) {
      // Mark current step as complete if validation passes
      const shouldComplete = stepValidation?.isCompleted ?? false;
      const newProgress = await updateOnboardingStep(currentStep, shouldComplete);
      if (newProgress) {
        setProgress(newProgress);
      }

      const newStep = (currentStep + 1) as WizardStepId;
      setCurrentStep(newStep);
    }
  }, [currentStep, stepValidation]);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    router.push('/roi?onboarding=complete');
  }, [router]);

  const totalEstimatedMinutes = WIZARD_STEPS.reduce(
    (sum, step) => sum + step.estimatedMinutes,
    0
  );

  const currentStepData = WIZARD_STEPS.find((s) => s.id === currentStep);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If already complete, redirect to dashboard
  if (progress?.isComplete) {
    router.push('/roi');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/roi">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold">RoI Setup Wizard</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>~{totalEstimatedMinutes} min total</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/roi">
                <X className="h-4 w-4 mr-2" />
                Exit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator - Desktop */}
        <div className="hidden md:block mb-10">
          <WizardProgress
            currentStep={currentStep}
            completedSteps={progress?.completedSteps || []}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Progress Indicator - Mobile */}
        <div className="md:hidden mb-6">
          <WizardProgressCompact
            currentStep={currentStep}
            completedSteps={progress?.completedSteps || []}
          />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <EntityStep
                validation={stepValidation || undefined}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <VendorsStep
                validation={stepValidation || undefined}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}
            {currentStep === 3 && (
              <ServicesStep
                validation={stepValidation || undefined}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}
            {currentStep === 4 && (
              <FunctionsStep
                validation={stepValidation || undefined}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}
            {currentStep === 5 && (
              <ReviewStep
                validation={stepValidation || undefined}
                onBack={handleBack}
                onComplete={handleComplete}
              />
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        {currentStepData && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              This step maps to RoI template <strong>{currentStepData.template || 'Review'}</strong>.
              {' '}
              <Link href="/docs/roi" className="text-primary hover:underline">
                Learn more about RoI templates
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
