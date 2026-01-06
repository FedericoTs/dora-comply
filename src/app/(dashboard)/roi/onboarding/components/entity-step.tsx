'use client';

/**
 * Entity Information Step (Step 1)
 *
 * Collects organization details required for RoI B_01.01
 */

import { useState, useEffect } from 'react';
import { Building2, Globe, Hash, FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WizardStep, StepSection } from './wizard-step';
import { EBA_COUNTRY_CODES, EBA_ENTITY_TYPES } from '@/lib/roi/mappings';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface EntityStepProps {
  validation?: OnboardingStepData;
  onBack?: () => void;
  onNext?: () => void;
}

interface EntityFormData {
  legalName: string;
  tradingName: string;
  leiCode: string;
  country: string;
  entityType: string;
  registrationNumber: string;
}

export function EntityStep({ validation, onBack, onNext }: EntityStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EntityFormData>({
    legalName: '',
    tradingName: '',
    leiCode: '',
    country: '',
    entityType: '',
    registrationNumber: '',
  });

  // Load existing organization data
  useEffect(() => {
    async function loadOrganization() {
      try {
        const response = await fetch('/api/organization');
        if (response.ok) {
          const org = await response.json();
          setFormData({
            legalName: org.legal_name || org.name || '',
            tradingName: org.trading_name || '',
            leiCode: org.lei_code || '',
            country: org.country || '',
            entityType: org.entity_type || '',
            registrationNumber: org.registration_number || '',
          });
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
      }
    }
    loadOrganization();
  }, []);

  const handleChange = (field: keyof EntityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: formData.legalName,
          trading_name: formData.tradingName,
          lei_code: formData.leiCode,
          country: formData.country,
          entity_type: formData.entityType,
          registration_number: formData.registrationNumber,
        }),
      });

      if (response.ok) {
        onNext?.();
      }
    } catch (error) {
      console.error('Failed to save organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WizardStep
      stepId={1 as WizardStepId}
      title="Entity Information"
      description="Enter your organization's details as they will appear in the DORA Register of Information"
      icon={<Building2 className="h-6 w-6" />}
      validation={validation}
      isLoading={isLoading}
      isFirstStep
      onNext={handleNext}
    >
      <div className="space-y-6">
        {/* Legal Identity Section */}
        <StepSection
          title="Legal Identity"
          description="Official registration details for your financial entity"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legalName">
                Legal Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                placeholder="Full legal name as registered"
              />
              <p className="text-xs text-muted-foreground">
                As it appears in official registration documents
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradingName">Trading Name</Label>
              <Input
                id="tradingName"
                value={formData.tradingName}
                onChange={(e) => handleChange('tradingName', e.target.value)}
                placeholder="Brand or trading name (if different)"
              />
            </div>
          </div>
        </StepSection>

        {/* Identifiers Section */}
        <StepSection
          title="Identifiers"
          description="Unique identifiers required for regulatory reporting"
          icon={<Hash className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leiCode">
                LEI Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="leiCode"
                value={formData.leiCode}
                onChange={(e) => handleChange('leiCode', e.target.value.toUpperCase())}
                placeholder="20-character LEI"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Legal Entity Identifier (mandatory for DORA reporting)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="National registration number"
              />
            </div>
          </div>

          {!formData.leiCode && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md mt-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">LEI Required</p>
                <p className="text-muted-foreground">
                  A Legal Entity Identifier is mandatory for DORA Register of Information submissions.
                  {' '}
                  <a
                    href="https://www.gleif.org/en/lei/how-to-get-an-lei"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Get an LEI
                  </a>
                </p>
              </div>
            </div>
          )}
        </StepSection>

        {/* Location Section */}
        <StepSection
          title="Location & Type"
          description="Jurisdiction and entity classification"
          icon={<Globe className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleChange('country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EBA_COUNTRY_CODES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select
                value={formData.entityType}
                onValueChange={(value) => handleChange('entityType', value)}
              >
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EBA_ENTITY_TYPES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                As defined under DORA Article 2
              </p>
            </div>
          </div>
        </StepSection>
      </div>
    </WizardStep>
  );
}
