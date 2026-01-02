'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createIncidentAction } from '@/lib/incidents/actions';
import type { CreateIncidentInput, IncidentClassification, IncidentType, ImpactLevel } from '@/lib/incidents/types';
import { StepClassification } from './step-classification';
import { StepImpact } from './step-impact';
import { StepTimeline } from './step-timeline';
import { StepDetails } from './step-details';
import { StepReview } from './step-review';
import { toast } from 'sonner';

const STEPS = [
  { id: 'classification', title: 'Classification', description: 'Incident type and severity' },
  { id: 'impact', title: 'Impact', description: 'Affected services and clients' },
  { id: 'timeline', title: 'Timeline', description: 'When it happened' },
  { id: 'details', title: 'Details', description: 'Description and actions' },
  { id: 'review', title: 'Review', description: 'Confirm and submit' },
];

export interface WizardData {
  // Step 1: Classification
  classification: IncidentClassification;
  incident_type: IncidentType;

  // Step 2: Impact
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

  // Step 3: Timeline
  detection_datetime: string;
  occurrence_datetime?: string;

  // Step 4: Details
  title: string;
  description?: string;
  vendor_id?: string;
  root_cause?: string;
  remediation_actions?: string;
}

const initialData: WizardData = {
  classification: 'significant',
  incident_type: 'system_failure',
  services_affected: [],
  critical_functions_affected: [],
  data_breach: false,
  geographic_spread: [],
  detection_datetime: new Date().toISOString().slice(0, 16),
  title: '',
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
      case 0: // Classification
        if (!data.classification) {
          errors.classification = ['Classification is required'];
        }
        if (!data.incident_type) {
          errors.incident_type = ['Incident type is required'];
        }
        break;
      case 1: // Impact
        // No required fields, but we could add validation for numeric ranges
        break;
      case 2: // Timeline
        if (!data.detection_datetime) {
          errors.detection_datetime = ['Detection time is required'];
        }
        break;
      case 3: // Details
        if (!data.title || data.title.trim().length < 3) {
          errors.title = ['Title is required (min 3 characters)'];
        }
        break;
      case 4: // Review
        // Final validation
        if (!data.title) errors.title = ['Title is required'];
        if (!data.detection_datetime) errors.detection_datetime = ['Detection time is required'];
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
        classification: data.classification,
        incident_type: data.incident_type,
        title: data.title,
        description: data.description,
        detection_datetime: new Date(data.detection_datetime).toISOString(),
        occurrence_datetime: data.occurrence_datetime
          ? new Date(data.occurrence_datetime).toISOString()
          : undefined,
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
      case 0:
        return (
          <StepClassification
            data={data}
            updateData={updateData}
            errors={stepErrors}
          />
        );
      case 1:
        return (
          <StepImpact
            data={data}
            updateData={updateData}
            errors={stepErrors}
            services={services}
            criticalFunctions={criticalFunctions}
          />
        );
      case 2:
        return (
          <StepTimeline
            data={data}
            updateData={updateData}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <StepDetails
            data={data}
            updateData={updateData}
            errors={stepErrors}
            vendors={vendors}
          />
        );
      case 4:
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
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Incident'
            )}
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
