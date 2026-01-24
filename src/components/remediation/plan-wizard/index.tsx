'use client';

/**
 * Remediation Plan Wizard
 *
 * Multi-step wizard for creating comprehensive remediation plans.
 * Steps: Plan Details → Priority & Timeline → Initial Actions → Review
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createRemediationPlan, createRemediationAction } from '@/lib/remediation/actions';
import type {
  SourceType,
  Priority,
  RiskLevel,
  Framework,
  ActionType,
} from '@/lib/remediation/types';
import { StepPlanDetails } from './step-plan-details';
import { StepPriorityTimeline } from './step-priority-timeline';
import { StepInitialActions } from './step-initial-actions';
import { StepReview } from './step-review';
import { toast } from 'sonner';

const STEPS = [
  { id: 'details', title: 'Plan Details', description: 'What needs to be remediated', time: '2 min' },
  { id: 'priority', title: 'Priority & Timeline', description: 'Set priority and target dates', time: '1 min' },
  { id: 'actions', title: 'Initial Actions', description: 'Add remediation tasks (optional)', time: '3 min' },
  { id: 'review', title: 'Review', description: 'Confirm and create', time: '1 min' },
];

const TOTAL_TIME = '~7 min';

export interface WizardAction {
  id: string; // Temporary ID for UI
  title: string;
  description?: string;
  action_type: ActionType;
  priority: Priority;
  due_date?: string;
  estimated_hours?: number;
  requires_evidence: boolean;
}

export interface WizardData {
  // Step 1: Plan Details
  title: string;
  description?: string;
  source_type: SourceType;
  source_id?: string;
  vendor_id?: string;
  framework?: Framework;

  // Step 2: Priority & Timeline
  priority: Priority;
  risk_level?: RiskLevel;
  target_date?: string;
  owner_id?: string;
  estimated_cost?: number;
  cost_currency: string;
  tags: string[];
  notes?: string;

  // Step 3: Initial Actions
  actions: WizardAction[];
}

const initialData: WizardData = {
  title: '',
  source_type: 'manual',
  priority: 'medium',
  cost_currency: 'EUR',
  tags: [],
  actions: [],
};

interface PlanWizardProps {
  vendors?: Array<{ id: string; name: string }>;
  teamMembers?: Array<{ id: string; full_name: string; email: string }>;
  sourceType?: SourceType;
  sourceId?: string;
  vendorId?: string;
  prefilledTitle?: string;
  prefilledDescription?: string;
}

export function PlanWizard({
  vendors = [],
  teamMembers = [],
  sourceType,
  sourceId,
  vendorId,
  prefilledTitle,
  prefilledDescription,
}: PlanWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => ({
    ...initialData,
    source_type: sourceType || 'manual',
    source_id: sourceId,
    vendor_id: vendorId,
    title: prefilledTitle || '',
    description: prefilledDescription,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setStepErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field];
      });
      return newErrors;
    });
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const errors: Record<string, string[]> = {};

    switch (step) {
      case 0: // Plan Details
        if (!data.title || data.title.trim().length < 3) {
          errors.title = ['Title is required (min 3 characters)'];
        }
        if (!data.source_type) {
          errors.source_type = ['Source type is required'];
        }
        break;

      case 1: // Priority & Timeline
        if (!data.priority) {
          errors.priority = ['Priority is required'];
        }
        break;

      case 2: // Initial Actions
        // Actions are optional, but validate any that are added
        data.actions.forEach((action, index) => {
          if (!action.title || action.title.trim().length < 3) {
            errors[`action_${index}_title`] = ['Action title is required (min 3 characters)'];
          }
        });
        break;

      case 3: // Review
        // Final validation
        if (!data.title || data.title.trim().length < 3) {
          errors.title = ['Title is required'];
        }
        if (!data.priority) {
          errors.priority = ['Priority is required'];
        }
        break;
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }, [data]);

  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Create the plan first
      const planResult = await createRemediationPlan({
        title: data.title.trim(),
        description: data.description?.trim(),
        source_type: data.source_type,
        source_id: data.source_id,
        vendor_id: data.vendor_id,
        framework: data.framework,
        priority: data.priority,
        risk_level: data.risk_level,
        target_date: data.target_date,
        owner_id: data.owner_id,
        estimated_cost: data.estimated_cost,
        cost_currency: data.cost_currency,
        tags: data.tags.length > 0 ? data.tags : undefined,
        notes: data.notes?.trim(),
      });

      if (!planResult.success || !planResult.planId) {
        toast.error(planResult.error || 'Failed to create plan');
        return;
      }

      // Create any initial actions
      if (data.actions.length > 0) {
        const actionPromises = data.actions.map((action) =>
          createRemediationAction({
            plan_id: planResult.planId!,
            title: action.title.trim(),
            description: action.description?.trim(),
            action_type: action.action_type,
            priority: action.priority,
            due_date: action.due_date,
            estimated_hours: action.estimated_hours,
            requires_evidence: action.requires_evidence,
          })
        );

        const actionResults = await Promise.all(actionPromises);
        const failedActions = actionResults.filter(r => !r.success);

        if (failedActions.length > 0) {
          toast.warning(`Plan created but ${failedActions.length} action(s) failed to create`);
        }
      }

      toast.success('Remediation plan created successfully');
      router.push(`/remediation/${planResult.planId}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepPlanDetails
            data={data}
            updateData={updateData}
            errors={stepErrors}
            vendors={vendors}
            disableSourceType={!!sourceType}
          />
        );
      case 1:
        return (
          <StepPriorityTimeline
            data={data}
            updateData={updateData}
            errors={stepErrors}
            teamMembers={teamMembers}
          />
        );
      case 2:
        return (
          <StepInitialActions
            data={data}
            updateData={updateData}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <StepReview
            data={data}
            vendors={vendors}
            teamMembers={teamMembers}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium text-primary">Create Remediation Plan</p>
            <p className="text-sm text-muted-foreground">
              Track and manage compliance gaps systematically
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{TOTAL_TIME}</span>
          <span>to complete</span>
        </div>
      </div>

      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                index !== STEPS.length - 1 && 'pr-8 sm:pr-20'
              )}
            >
              {/* Connector line */}
              {index !== STEPS.length - 1 && (
                <div
                  className="absolute top-4 left-0 -right-2 hidden h-0.5 w-full sm:block"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-colors',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => goToStep(index)}
                disabled={index > currentStep + 1}
                className={cn(
                  'group relative flex flex-col items-center',
                  index > currentStep + 1 && 'cursor-not-allowed opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border-2 border-muted bg-background text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="mt-2 hidden text-xs font-medium sm:block">
                  {step.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Plan'}
          </Button>
        ) : (
          <Button onClick={goToNextStep}>
            {currentStep === 2 && data.actions.length === 0 ? 'Skip' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
