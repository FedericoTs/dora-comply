'use client';

/**
 * Entity Information Step (Step 1)
 *
 * Collects organization details required for RoI B_01.01
 * Includes GLEIF LEI search and validation
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Globe,
  Hash,
  FileText,
  AlertCircle,
  Search,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WizardStep, StepSection } from './wizard-step';
import { EBA_COUNTRY_CODES, EBA_ENTITY_TYPES } from '@/lib/roi/mappings';
import { searchEntities, validateLEI, getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';
import type { OnboardingStepData, WizardStepId } from '@/lib/roi/onboarding-types';

interface EntityStepProps {
  validation?: OnboardingStepData;
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

export function EntityStep({ validation, onNext }: EntityStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingLei, setIsSearchingLei] = useState(false);
  const [leiSuggestions, setLeiSuggestions] = useState<GLEIFEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<GLEIFEntity | null>(null);
  const [leiError, setLeiError] = useState<string | null>(null);
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
          // If LEI exists, mark as verified
          if (org.lei_code && org.lei_code.length === 20) {
            setSelectedEntity({
              lei: org.lei_code,
              legalName: org.legal_name || org.name || '',
              legalAddress: {
                country: org.country || '',
                city: '',
              },
              registrationStatus: 'ISSUED',
            });
          }
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
      }
    }
    loadOrganization();
  }, []);

  const handleChange = (field: keyof EntityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'leiCode') {
      setLeiError(null);
      setSelectedEntity(null);
    }
  };

  // Search for entities by name (GLEIF)
  const handleNameSearch = useCallback(async () => {
    if (!formData.legalName || formData.legalName.length < 3) return;

    setIsSearchingLei(true);
    setLeiSuggestions([]);

    try {
      const result = await searchEntities(formData.legalName, 5);
      if (result.results.length > 0) {
        setLeiSuggestions(result.results);
      }
    } catch (error) {
      console.error('LEI search error:', error);
    } finally {
      setIsSearchingLei(false);
    }
  }, [formData.legalName]);

  // Verify LEI code directly
  const handleLeiVerify = useCallback(async () => {
    if (!formData.leiCode || formData.leiCode.length !== 20) {
      setLeiError('LEI must be exactly 20 characters');
      return;
    }

    setIsSearchingLei(true);
    setLeiError(null);

    try {
      const result = await validateLEI(formData.leiCode);

      if (result.valid && result.entity) {
        setSelectedEntity(result.entity);
        setFormData((prev) => ({
          ...prev,
          legalName: result.entity!.legalName,
          country: result.entity!.legalAddress.country,
        }));
      } else {
        setLeiError(result.error || 'LEI not found');
      }
    } catch (error) {
      setLeiError('Failed to verify LEI');
      console.error('LEI verification error:', error);
    } finally {
      setIsSearchingLei(false);
    }
  }, [formData.leiCode]);

  // Select entity from suggestions
  const handleSelectEntity = (entity: GLEIFEntity) => {
    setSelectedEntity(entity);
    setFormData((prev) => ({
      ...prev,
      legalName: entity.legalName,
      leiCode: entity.lei,
      country: entity.legalAddress.country,
    }));
    setLeiSuggestions([]);
    setLeiError(null);
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
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalName">
                  Legal Name <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                    placeholder="Full legal name as registered"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNameSearch}
                    disabled={isSearchingLei || formData.legalName.length < 3}
                    title="Search GLEIF for LEI"
                  >
                    {isSearchingLei ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search by name to find your LEI automatically
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

            {/* LEI Suggestions */}
            {leiSuggestions.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Matching entities from GLEIF:
                </p>
                <div className="space-y-1">
                  {leiSuggestions.map((entity) => (
                    <button
                      key={entity.lei}
                      type="button"
                      className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                      onClick={() => handleSelectEntity(entity)}
                    >
                      <p className="font-medium text-sm">{entity.legalName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{getCountryFlag(entity.legalAddress.country)} {entity.legalAddress.country}</span>
                        <span>•</span>
                        <span className="font-mono">LEI: {entity.lei}</span>
                        {entity.registrationStatus === 'ISSUED' && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-green-600 border-green-200 h-5">
                              Active
                            </Badge>
                          </>
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <div className="flex gap-2">
                <Input
                  id="leiCode"
                  value={formData.leiCode}
                  onChange={(e) => handleChange('leiCode', e.target.value.toUpperCase())}
                  placeholder="20-character LEI"
                  maxLength={20}
                  className={`flex-1 font-mono uppercase ${
                    leiError ? 'border-destructive' : selectedEntity ? 'border-green-500' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLeiVerify}
                  disabled={isSearchingLei || formData.leiCode.length !== 20}
                >
                  {isSearchingLei ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              {leiError && (
                <p className="text-xs text-destructive">{leiError}</p>
              )}
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

          {/* Verified Entity Info */}
          {selectedEntity && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 mt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">Entity verified via GLEIF</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEntity.legalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCountryFlag(selectedEntity.legalAddress.country)}{' '}
                    {selectedEntity.legalAddress.city && `${selectedEntity.legalAddress.city}, `}
                    {selectedEntity.legalAddress.country}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  {selectedEntity.registrationStatus}
                </Badge>
              </div>
            </div>
          )}

          {!formData.leiCode && !selectedEntity && (
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
                      {getCountryFlag(code)} {code} - {name}
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
