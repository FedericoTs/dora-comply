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
import { cn } from '@/lib/utils';

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
    },
  });

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      try {
        const response = await fetch('/api/settings/organization');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            form.reset({
              name: data.data.name || '',
              lei: data.data.lei || '',
              entityType: data.data.entity_type || 'financial_entity',
              jurisdiction: data.data.jurisdiction || 'EU',
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
      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          lei: data.lei || null,
          entity_type: data.entityType,
          jurisdiction: data.jurisdiction,
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
