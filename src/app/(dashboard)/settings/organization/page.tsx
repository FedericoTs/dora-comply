'use client';

/**
 * Organization Settings Page
 *
 * Manage organization details including LEI, jurisdiction, and entity type.
 * Features GLEIF integration for LEI auto-validation and data enrichment.
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Search,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  Info,
  ExternalLink,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ENTITY_TYPE_INFO,
  DORA_ARTICLE_DESCRIPTIONS,
} from '@/lib/compliance/entity-classification';

// Schema
const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  lei: z.string().optional(),
  entityType: z.enum([
    'financial_entity',
    'credit_institution',
    'investment_firm',
    'insurance_undertaking',
    'payment_institution',
    'ict_service_provider',
  ]),
  jurisdiction: z.string().min(2, 'Jurisdiction is required'),
  // Entity classification fields
  significanceLevel: z.enum(['significant', 'non_significant', 'simplified']),
  significanceRationale: z.string().optional(),
  // Number fields stored as strings to allow empty values
  employeeCount: z.string().optional(),
  totalAssetsEur: z.string().optional(),
  annualGrossPremiumEur: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

// LEI validation result type
interface LEIValidationResult {
  valid: boolean;
  entity?: {
    lei: string;
    legalName: string;
    legalAddress: {
      country: string;
      city: string;
      region?: string;
    };
    registrationStatus: string;
    jurisdiction?: string;
    directParent?: {
      lei: string;
      legalName: string;
      country: string;
    };
    ultimateParent?: {
      lei: string;
      legalName: string;
      country: string;
    };
  };
  error?: string;
  warnings?: string[];
}

const ENTITY_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  financial_entity: {
    label: 'Financial Entity',
    description: 'General financial services entity',
  },
  credit_institution: {
    label: 'Credit Institution',
    description: 'Bank or credit provider',
  },
  investment_firm: {
    label: 'Investment Firm',
    description: 'Asset manager, broker, or trading venue',
  },
  insurance_undertaking: {
    label: 'Insurance Undertaking',
    description: 'Insurer, reinsurer, or pension fund',
  },
  payment_institution: {
    label: 'Payment Institution',
    description: 'Payment processor or e-money issuer',
  },
  ict_service_provider: {
    label: 'ICT Service Provider',
    description: 'Technology or cloud service provider',
  },
};

const EU_JURISDICTIONS = [
  { code: 'EU', label: 'European Union (General)' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'IE', label: 'Ireland' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'BE', label: 'Belgium' },
  { code: 'AT', label: 'Austria' },
  { code: 'PT', label: 'Portugal' },
  { code: 'FI', label: 'Finland' },
  { code: 'SE', label: 'Sweden' },
  { code: 'DK', label: 'Denmark' },
  { code: 'PL', label: 'Poland' },
  { code: 'CZ', label: 'Czech Republic' },
  { code: 'RO', label: 'Romania' },
  { code: 'HU', label: 'Hungary' },
  { code: 'GR', label: 'Greece' },
  { code: 'BG', label: 'Bulgaria' },
  { code: 'SK', label: 'Slovakia' },
  { code: 'HR', label: 'Croatia' },
  { code: 'SI', label: 'Slovenia' },
  { code: 'LV', label: 'Latvia' },
  { code: 'LT', label: 'Lithuania' },
  { code: 'EE', label: 'Estonia' },
  { code: 'CY', label: 'Cyprus' },
  { code: 'MT', label: 'Malta' },
];

export default function OrganizationSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leiValidation, setLeiValidation] = useState<LEIValidationResult | null>(null);
  const [isValidatingLei, setIsValidatingLei] = useState(false);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      lei: '',
      entityType: 'financial_entity',
      jurisdiction: 'EU',
      significanceLevel: 'non_significant',
      significanceRationale: '',
      employeeCount: '',
      totalAssetsEur: '',
      annualGrossPremiumEur: '',
    },
  });

  // Watch significance level for conditional rendering
  const significanceLevel = form.watch('significanceLevel');
  const entityType = form.watch('entityType');

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      try {
        const response = await fetch('/api/settings/organization');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Determine significance level from flags
            let sigLevel: 'significant' | 'non_significant' | 'simplified' = 'non_significant';
            if (data.data.simplified_framework_eligible) {
              sigLevel = 'simplified';
            } else if (data.data.is_significant) {
              sigLevel = 'significant';
            }

            form.reset({
              name: data.data.name || '',
              lei: data.data.lei || '',
              entityType: data.data.entity_type || 'financial_entity',
              jurisdiction: data.data.jurisdiction || 'EU',
              significanceLevel: sigLevel,
              significanceRationale: data.data.significance_rationale || '',
              employeeCount: data.data.employee_count || '',
              totalAssetsEur: data.data.total_assets_eur || '',
              annualGrossPremiumEur: data.data.annual_gross_premium_eur || '',
            });

            // If LEI exists, validate it
            if (data.data.lei) {
              validateLEI(data.data.lei);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
        toast.error('Failed to load organization settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganization();
  }, [form]);

  // LEI validation function
  const validateLEI = useCallback(async (lei: string) => {
    if (!lei || lei.length !== 20) {
      setLeiValidation(null);
      return;
    }

    setIsValidatingLei(true);
    try {
      const response = await fetch(`/api/gleif/validate?lei=${encodeURIComponent(lei)}`);
      const data = await response.json();
      setLeiValidation(data);

      // Auto-fill form fields if validation successful
      if (data.valid && data.entity) {
        const currentName = form.getValues('name');
        const currentJurisdiction = form.getValues('jurisdiction');

        // Only auto-fill if fields are empty or match existing data
        if (!currentName || currentName === data.entity.legalName) {
          form.setValue('name', data.entity.legalName);
        }

        if (data.entity.jurisdiction) {
          const countryCode = data.entity.legalAddress.country;
          if (!currentJurisdiction || currentJurisdiction === 'EU') {
            const matchingJurisdiction = EU_JURISDICTIONS.find((j) => j.code === countryCode);
            if (matchingJurisdiction) {
              form.setValue('jurisdiction', countryCode);
            }
          }
        }
      }
    } catch (error) {
      console.error('LEI validation error:', error);
      setLeiValidation({ valid: false, error: 'Failed to validate LEI' });
    } finally {
      setIsValidatingLei(false);
    }
  }, [form]);

  // Debounced LEI validation
  const handleLeiChange = useCallback((value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    form.setValue('lei', normalized);

    if (normalized.length === 20) {
      validateLEI(normalized);
    } else {
      setLeiValidation(null);
    }
  }, [form, validateLEI]);

  // Save organization
  async function onSubmit(data: OrganizationFormData) {
    setIsSaving(true);
    try {
      // Parse string numbers to actual numbers, or null if empty
      const parseNumber = (val: string | undefined): number | null => {
        if (!val || val.trim() === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          lei: data.lei || null,
          entity_type: data.entityType,
          jurisdiction: data.jurisdiction,
          // Classification fields
          is_significant: data.significanceLevel === 'significant',
          simplified_framework_eligible: data.significanceLevel === 'simplified',
          significance_rationale: data.significanceLevel === 'significant' ? data.significanceRationale : null,
          employee_count: parseNumber(data.employeeCount),
          total_assets_eur: parseNumber(data.totalAssetsEur),
          annual_gross_premium_eur: parseNumber(data.annualGrossPremiumEur),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Organization settings saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save organization settings');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-medium">Organization Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization&apos;s details for DORA compliance reporting
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* LEI Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Legal Entity Identifier (LEI)
              </CardTitle>
              <CardDescription>
                Your 20-character LEI from GLEIF. Required for DORA Register of Information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="lei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LEI Code</FormLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="529900T8BM49AURSDO55"
                            className={cn(
                              'font-mono uppercase',
                              leiValidation?.valid && 'border-green-500 pr-10',
                              leiValidation?.error && 'border-red-500 pr-10'
                            )}
                            maxLength={20}
                            onChange={(e) => handleLeiChange(e.target.value)}
                          />
                        </FormControl>
                        {isValidatingLei && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!isValidatingLei && leiValidation?.valid && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {!isValidatingLei && leiValidation?.error && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const lei = form.getValues('lei');
                          if (lei) validateLEI(lei);
                        }}
                        disabled={isValidatingLei || !form.getValues('lei')}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                    </div>
                    <FormDescription>
                      <a
                        href="https://search.gleif.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Search GLEIF Database
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LEI Validation Result */}
              {leiValidation && (
                <div className="space-y-3">
                  {leiValidation.valid && leiValidation.entity && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800 dark:text-green-200">
                        LEI Verified
                      </AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Entity:</strong> {leiValidation.entity.legalName}
                          </p>
                          <p>
                            <strong>Location:</strong>{' '}
                            {leiValidation.entity.legalAddress.city},{' '}
                            {leiValidation.entity.legalAddress.country}
                          </p>
                          <p>
                            <strong>Status:</strong>{' '}
                            <Badge
                              variant="outline"
                              className="ml-1 text-xs bg-green-100 text-green-700 border-green-300"
                            >
                              {leiValidation.entity.registrationStatus}
                            </Badge>
                          </p>
                          {leiValidation.entity.ultimateParent && (
                            <p>
                              <strong>Ultimate Parent:</strong>{' '}
                              {leiValidation.entity.ultimateParent.legalName} (
                              {leiValidation.entity.ultimateParent.country})
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {leiValidation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Invalid LEI</AlertTitle>
                      <AlertDescription>{leiValidation.error}</AlertDescription>
                    </Alert>
                  )}

                  {leiValidation.warnings && leiValidation.warnings.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 dark:text-amber-200">
                        Warnings
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-300">
                        <ul className="list-disc list-inside">
                          {leiValidation.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Financial Services Ltd" />
                    </FormControl>
                    <FormDescription>
                      Legal name as registered with your national authority
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ENTITY_TYPE_LABELS).map(([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">{description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Classification per DORA Article 2 (determines regulatory requirements)
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
                    <FormLabel>Jurisdiction</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EU_JURISDICTIONS.map((j) => (
                          <SelectItem key={j.code} value={j.code}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Primary regulatory jurisdiction for DORA reporting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Entity Classification Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Entity Classification
              </CardTitle>
              <CardDescription>
                DORA applies proportionally based on entity significance. This determines your testing and reporting requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Significance Level Selection */}
              <FormField
                control={form.control}
                name="significanceLevel"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Significance Assessment</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {/* Significant Entity */}
                        <div
                          className={cn(
                            'flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors',
                            field.value === 'significant'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange('significant')}
                        >
                          <RadioGroupItem value="significant" id="significant" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="significant" className="font-medium cursor-pointer flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              Significant Entity
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Subject to enhanced oversight including mandatory TLPT (Art. 26-27) every 3 years.
                              Typically includes systemically important institutions.
                            </p>
                            {!ENTITY_TYPE_INFO[entityType]?.canBeSignificant && (
                              <p className="text-xs text-warning mt-2">
                                Note: {ENTITY_TYPE_INFO[entityType]?.label} entities are not typically designated as significant.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Non-Significant Entity */}
                        <div
                          className={cn(
                            'flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors',
                            field.value === 'non_significant'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange('non_significant')}
                        >
                          <RadioGroupItem value="non_significant" id="non_significant" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="non_significant" className="font-medium cursor-pointer flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-info" />
                              Non-Significant Entity
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Standard DORA requirements apply. Not subject to mandatory TLPT but may conduct
                              voluntary penetration testing.
                            </p>
                          </div>
                        </div>

                        {/* Simplified Framework */}
                        <div
                          className={cn(
                            'flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors',
                            field.value === 'simplified'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50',
                            !ENTITY_TYPE_INFO[entityType]?.canUseSimplified && 'opacity-50'
                          )}
                          onClick={() => {
                            if (ENTITY_TYPE_INFO[entityType]?.canUseSimplified) {
                              field.onChange('simplified');
                            }
                          }}
                        >
                          <RadioGroupItem
                            value="simplified"
                            id="simplified"
                            className="mt-1"
                            disabled={!ENTITY_TYPE_INFO[entityType]?.canUseSimplified}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor="simplified"
                              className={cn(
                                'font-medium cursor-pointer flex items-center gap-2',
                                !ENTITY_TYPE_INFO[entityType]?.canUseSimplified && 'cursor-not-allowed'
                              )}
                            >
                              <Users className="h-4 w-4 text-success" />
                              Simplified Framework (Art. 16)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              For small or exempted institutions only. Proportionate ICT risk management requirements apply.
                            </p>
                            {!ENTITY_TYPE_INFO[entityType]?.canUseSimplified && (
                              <p className="text-xs text-destructive mt-2">
                                {ENTITY_TYPE_INFO[entityType]?.label} entities are not eligible for the simplified framework.
                              </p>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Significance Rationale - Only show when significant is selected */}
              {significanceLevel === 'significant' && (
                <FormField
                  control={form.control}
                  name="significanceRationale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Significance Rationale</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Document the basis for the significant entity designation (e.g., regulatory notification, asset thresholds, systemic importance criteria)..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Required for audit trail. Document why this entity is designated as significant under DORA.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              {/* Size Metrics (Optional) */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Size Metrics (Optional)</h4>
                  <p className="text-xs text-muted-foreground">
                    These metrics help assess eligibility thresholds. They are optional but useful for regulatory documentation.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="employeeCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Employee Count
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 500"
                            min={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAssetsEur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Total Assets (EUR)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 500000000"
                            min={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {entityType === 'insurance_undertaking' && (
                    <FormField
                      control={form.control}
                      name="annualGrossPremiumEur"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Annual Gross Premium (EUR)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="e.g., 100000000"
                              min={0}
                            />
                          </FormControl>
                          <FormDescription>
                            For insurance undertakings - used for significance threshold calculation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Classification Summary */}
              <Alert className="border-info/50 bg-info/5">
                <Info className="h-4 w-4 text-info" />
                <AlertTitle className="text-info">Classification Summary</AlertTitle>
                <AlertDescription className="text-sm">
                  {significanceLevel === 'significant' && (
                    <div className="space-y-2 mt-2">
                      <p>As a <strong>significant entity</strong>, your organization is subject to:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Full ICT Risk Management Framework (Art. 5-15)</li>
                        <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
                        <li>Mandatory TLPT every 3 years (Art. 26-27)</li>
                        <li>Third-party risk management (Art. 28-30)</li>
                      </ul>
                    </div>
                  )}
                  {significanceLevel === 'non_significant' && (
                    <div className="space-y-2 mt-2">
                      <p>As a <strong>non-significant entity</strong>, your organization is subject to:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Full ICT Risk Management Framework (Art. 5-15)</li>
                        <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
                        <li>Digital Operational Resilience Testing (Art. 24-25)</li>
                        <li>Third-party risk management (Art. 28-30)</li>
                      </ul>
                      <p className="text-xs mt-2">Note: TLPT is not mandatory but voluntary testing is recommended.</p>
                    </div>
                  )}
                  {significanceLevel === 'simplified' && (
                    <div className="space-y-2 mt-2">
                      <p>Under the <strong>simplified framework</strong> (Art. 16), your organization has:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Simplified ICT Risk Management (Art. 16)</li>
                        <li>Incident Reporting within DORA deadlines (Art. 17-23)</li>
                        <li>Basic Resilience Testing (Art. 24-25)</li>
                        <li>Third-party risk management (Art. 28-30)</li>
                      </ul>
                      <p className="text-xs mt-2">Proportionate requirements apply based on your size and risk profile.</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
