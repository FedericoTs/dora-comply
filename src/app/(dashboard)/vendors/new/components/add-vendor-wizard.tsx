'use client';

/**
 * Add Vendor Wizard
 *
 * Simplified 2-step form for adding new vendors:
 * 1. Basic Info - Name and LEI lookup
 * 2. Risk Profile - Classification and DORA details
 */

import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useAddVendorWizard } from './use-add-vendor-wizard';
import { WizardProgress } from './wizard-progress';
import { StepIndicator } from './step-indicator';
import { BasicInfoStep } from './basic-info-step';
import { RiskProfileStep } from './risk-profile-step';
import { WizardNavigation } from './wizard-navigation';

export function AddVendorWizard() {
  const {
    currentStep,
    isSubmitting,
    isSearchingLei,
    leiSuggestions,
    selectedEntity,
    form,
    totalSteps,
    handleLeiLookup,
    handleNameSearch,
    handleSelectEntity,
    nextStep,
    prevStep,
    onSubmit,
  } = useAddVendorWizard();

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={currentStep} />
      <StepIndicator currentStep={currentStep} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              {currentStep === 1 && (
                <BasicInfoStep
                  form={form}
                  isSearchingLei={isSearchingLei}
                  leiSuggestions={leiSuggestions}
                  selectedEntity={selectedEntity}
                  onNameSearch={handleNameSearch}
                  onLeiLookup={handleLeiLookup}
                  onSelectEntity={handleSelectEntity}
                />
              )}

              {currentStep === 2 && (
                <RiskProfileStep form={form} />
              )}
            </CardContent>
          </Card>

          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            isSubmitting={isSubmitting}
            onPrevious={prevStep}
            onNext={nextStep}
          />
        </form>
      </Form>
    </div>
  );
}
