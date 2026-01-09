'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createIncidentAction } from '@/lib/incidents/actions';
import type { CreateIncidentInput, IncidentClassification, IncidentType, ImpactLevel } from '@/lib/incidents/types';
import { StepBasicInfo } from './step-basic-info';
import { StepImpact } from './step-impact';
import { StepClassification } from './step-classification';
import { StepDetails } from './step-details';
import { StepReview } from './step-review';
import { toast } from 'sonner';

/**
 * New wizard flow designed for DORA compliance:
 * 1. Basic Info - Type, title, detection time (what happened and when)
 * 2. Impact - Assess business impact (determines classification)
 * 3. Classification - Auto-calculated from impact with override option
 * 4. Details - Additional context (vendor, root cause, remediation)
 * 5. Review - Confirm and submit
 */
const STEPS = [
  { id: 'basic-info', title: 'Basic Info', description: 'What happened and when', time: '2 min' },
  { id: 'impact', title: 'Impact', description: 'Business and client impact', time: '3 min' },
  { id: 'classification', title: 'Classification', description: 'DORA severity assessment', time: '1 min' },
  { id: 'details', title: 'Details', description: 'Context and remediation', time: '2 min' },
  { id: 'review', title: 'Review', description: 'Confirm and submit', time: '1 min' },
];

// Total estimated time and DORA deadline reminder
const TOTAL_TIME = '~9 min';
const DORA_DEADLINE_NOTICE = '4-hour initial report deadline under DORA';

export interface WizardData {
  // Step 1: Basic Info
  incident_type: IncidentType;
  title: string;
  detection_datetime: string;
  occurrence_datetime?: string;
  description?: string;

  // Step 2: Impact Assessment
  services_affected: string[];
  critical_functions_affected: string[];
  clients_affected_count?: number;
  clients_affected_percentage?: number;
  transactions_affected_count?: number;
  transactions_value_affected?: number;
  data_breach: boolean;
  data_records_affected?: number;
  geographic_spread: string[];
  economic_impact?: number;
  reputational_impact?: ImpactLevel;

  // Step 3: Classification (auto-calculated)
  classification: IncidentClassification;
  classification_calculated?: IncidentClassification;
  classification_override?: boolean;
  classification_override_justification?: string;

  // Step 4: Details
  vendor_id?: string;
  root_cause?: string;
  remediation_actions?: string;
}

const initialData: WizardData = {
  incident_type: 'system_failure',
  title: '',
  detection_datetime: new Date().toISOString(),
  services_affected: [],
  critical_functions_affected: [],
  data_breach: false,
  geographic_spread: [],
  classification: 'minor', // Will be auto-calculated
};

interface IncidentWizardProps {
  services?: Array<{ id: string; name: string }>;
  criticalFunctions?: Array<{ id: string; name: string }>;
  vendors?: Array<{ id: string; name: string }>;
}

export function IncidentWizard({
  services = [],
  criticalFunctions = [],
  vendors = [],
}: IncidentWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
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
      case 0: // Basic Info
        if (!data.incident_type) {
          errors.incident_type = ['Incident type is required'];
        }
        if (!data.title || data.title.trim().length < 3) {
          errors.title = ['Title is required (min 3 characters)'];
        }
        if (!data.detection_datetime) {
          errors.detection_datetime = ['Detection time is required'];
        }
        break;
      case 1: // Impact
        // No required fields - impact data is optional but affects classification
        break;
      case 2: // Classification
        // Validate override justification if override is enabled
        if (data.classification_override) {
          if (!data.classification_override_justification ||
              data.classification_override_justification.trim().length < 50) {
            errors.classification_override_justification = [
              'Override justification is required (min 50 characters)'
            ];
          }
        }
        break;
      case 3: // Details
        // No required fields - vendor, root cause, remediation are optional
        break;
      case 4: // Review
        // Final validation - check all required fields
        if (!data.title) errors.title = ['Title is required'];
        if (!data.detection_datetime) errors.detection_datetime = ['Detection time is required'];
        if (!data.incident_type) errors.incident_type = ['Incident type is required'];
        if (data.classification_override &&
            (!data.classification_override_justification ||
             data.classification_override_justification.trim().length < 50)) {
          errors.classification_override_justification = [
            'Override justification is required (min 50 characters)'
          ];
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
    // Only allow going to completed steps or the next step
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const input: CreateIncidentInput = {
        // Basic Info
        incident_type: data.incident_type,
        title: data.title,
        description: data.description,
        detection_datetime: new Date(data.detection_datetime).toISOString(),
        occurrence_datetime: data.occurrence_datetime
          ? new Date(data.occurrence_datetime).toISOString()
          : undefined,

        // Impact Assessment
        services_affected: data.services_affected,
        critical_functions_affected: data.critical_functions_affected,
        clients_affected_count: data.clients_affected_count,
        clients_affected_percentage: data.clients_affected_percentage,
        transactions_affected_count: data.transactions_affected_count,
        transactions_value_affected: data.transactions_value_affected,
        data_breach: data.data_breach,
        data_records_affected: data.data_records_affected,
        geographic_spread: data.geographic_spread,
        economic_impact: data.economic_impact,
        reputational_impact: data.reputational_impact,

        // Classification (auto-calculated with optional override)
        classification: data.classification,
        classification_calculated: data.classification_calculated,
        classification_override: data.classification_override,
        classification_override_justification: data.classification_override_justification,

        // Details
        vendor_id: data.vendor_id,
        root_cause: data.root_cause,
        remediation_actions: data.remediation_actions,
      };

      const result = await createIncidentAction(input);

      if (result.success) {
        toast.success('Incident created successfully');
        router.push(`/incidents/${result.incident.id}`);
      } else {
        toast.error(result.error || 'Failed to create incident');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <StepBasicInfo
            data={data}
            updateData={updateData}
            errors={stepErrors}
          />
        );
      case 1: // Impact Assessment
        return (
          <StepImpact
            data={data}
            updateData={updateData}
            errors={stepErrors}
            services={services}
            criticalFunctions={criticalFunctions}
          />
        );
      case 2: // Classification (auto-calculated)
        return (
          <StepClassification
            data={data}
            updateData={updateData}
            errors={stepErrors}
          />
        );
      case 3: // Details
        return (
          <StepDetails
            data={data}
            updateData={updateData}
            errors={stepErrors}
            vendors={vendors}
          />
        );
      case 4: // Review
        return (
          <StepReview
            data={data}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Estimate and Deadline Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">{DORA_DEADLINE_NOTICE}</p>
            <p className="text-sm text-amber-700 dark:text-amber-500/80">Complete this wizard to submit your initial report</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-500">
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
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Create Incident
          </Button>
        ) : (
          <Button onClick={goToNextStep}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
