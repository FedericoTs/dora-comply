'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Building2,
  Users,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  completeOnboarding,
  onboardingSchema,
  entityTypes,
  teamSizes,
  primaryUseCases,
  type OnboardingInput,
} from '@/lib/auth';

const ENTITY_TYPE_LABELS: Record<string, string> = {
  financial_entity: 'Financial Entity',
  credit_institution: 'Credit Institution',
  investment_firm: 'Investment Firm',
  insurance_undertaking: 'Insurance Undertaking',
  payment_institution: 'Payment Institution',
  ict_service_provider: 'ICT Service Provider',
};

const TEAM_SIZE_LABELS: Record<string, { label: string; description: string }> = {
  solo: { label: 'Just me', description: '1 user' },
  small: { label: 'Small team', description: '2-10 users' },
  medium: { label: 'Medium team', description: '11-50 users' },
  large: { label: 'Large team', description: '50+ users' },
};

const USE_CASE_LABELS: Record<string, { label: string; description: string }> = {
  vendor_assessment: {
    label: 'Vendor Assessment',
    description: 'Evaluate and monitor ICT third-party providers',
  },
  roi_generation: {
    label: 'Register of Information',
    description: 'Generate and maintain the DORA RoI',
  },
  incident_reporting: {
    label: 'Incident Reporting',
    description: 'Manage ICT-related incident notifications',
  },
  full_compliance: {
    label: 'Full DORA Compliance',
    description: 'Complete end-to-end DORA compliance solution',
  },
};

const STEPS = [
  { id: 'organization', title: 'Organization', icon: Building2 },
  { id: 'team', title: 'Team', icon: Users },
  { id: 'goals', title: 'Goals', icon: Target },
];

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      lei: '',
      entityType: 'financial_entity',
      jurisdiction: 'EU',
      teamSize: 'small',
      primaryUseCase: 'full_compliance',
    },
  });

  async function onSubmit(data: OnboardingInput) {
    setError(null);
    setIsLoading(true);

    try {
      const result = await completeOnboarding(data);

      if (!result.success) {
        setError(result.error?.message || 'An error occurred');
      }
      // On success, completeOnboarding redirects to dashboard
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function validateAndNext() {
    let fieldsToValidate: (keyof OnboardingInput)[] = [];

    switch (currentStep) {
      case 0:
        fieldsToValidate = ['organizationName', 'entityType', 'jurisdiction'];
        break;
      case 1:
        fieldsToValidate = ['teamSize'];
        break;
      case 2:
        fieldsToValidate = ['primaryUseCase'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep === STEPS.length - 1) {
        form.handleSubmit(onSubmit)();
      } else {
        nextStep();
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-0.5 mx-2 -mt-6',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="card-premium">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {currentStep === 0 && 'Tell us about your organization'}
              {currentStep === 1 && 'How big is your team?'}
              {currentStep === 2 && 'What brings you here?'}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              {currentStep === 0 && "We'll use this to customize your experience"}
              {currentStep === 1 && "This helps us recommend the right plan"}
              {currentStep === 2 && "Select your primary compliance goal"}
            </p>
          </div>
          <Form {...form}>
            <form className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Organization Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Financial Services"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entityTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {ENTITY_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your classification under DORA regulation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LEI (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="5493001KJTIIGC8Y1R12"
                            maxLength={20}
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Legal Entity Identifier (20 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary jurisdiction</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="EU"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Main regulatory jurisdiction
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Team Size */}
              {currentStep === 1 && (
                <FormField
                  control={form.control}
                  name="teamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          {teamSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => field.onChange(size)}
                              disabled={isLoading}
                              className={cn(
                                'p-4 rounded-lg border-2 text-left transition-colors',
                                'hover:border-primary/50',
                                field.value === size
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted'
                              )}
                            >
                              <p className="font-medium">
                                {TEAM_SIZE_LABELS[size].label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {TEAM_SIZE_LABELS[size].description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 3: Primary Use Case */}
              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="primaryUseCase"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          {primaryUseCases.map((useCase) => (
                            <button
                              key={useCase}
                              type="button"
                              onClick={() => field.onChange(useCase)}
                              disabled={isLoading}
                              className={cn(
                                'w-full p-4 rounded-lg border-2 text-left transition-colors',
                                'hover:border-primary/50',
                                field.value === useCase
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted'
                              )}
                            >
                              <p className="font-medium">
                                {USE_CASE_LABELS[useCase].label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {USE_CASE_LABELS[useCase].description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={validateAndNext}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStep === STEPS.length - 1 ? (
                    'Complete setup'
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
