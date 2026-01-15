'use client';

/**
 * Wizard Step Wrapper
 *
 * Provides consistent layout for wizard steps
 */

import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface WizardStepProps {
  stepId: WizardStepId;
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  validation?: OnboardingStepData;
  isLoading?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  nextLabel?: string;
}

export function WizardStep({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use (analytics, step tracking)
  stepId,
  title,
  description,
  icon,
  children,
  validation,
  isLoading = false,
  isFirstStep = false,
  isLastStep = false,
  onBack,
  onNext,
  onComplete,
  nextLabel,
}: WizardStepProps) {
  const hasErrors = validation?.validationErrors && validation.validationErrors.length > 0;
  const canProceed = validation?.canProceed ?? true;

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-6">
        {children}

        {/* Validation messages */}
        {hasErrors && (
          <div className="mt-6 space-y-2">
            {validation.validationErrors.map((error, i) => (
              <Alert key={i} variant="destructive" className="bg-destructive/5 border-destructive/20">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Success state */}
        {validation?.isCompleted && !hasErrors && (
          <Alert className="mt-6 bg-green-500/5 border-green-500/20 text-green-600">
            <Check className="h-4 w-4" />
            <AlertDescription>
              Step completed! You can proceed to the next step.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="px-0 pt-4 flex justify-between">
        <div>
          {!isFirstStep && (
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {!isLastStep ? (
            <Button
              onClick={onNext}
              disabled={isLoading || !canProceed}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {nextLabel || 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Step content section with optional icon
 */
interface StepSectionProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StepSection({
  title,
  description,
  icon,
  children,
  className,
}: StepSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
          )}
          <div>
            {title && <h3 className="font-medium">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Empty state for steps with no data
 */
interface EmptyStepStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyStepState({
  icon,
  title,
  description,
  action,
}: EmptyStepStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
