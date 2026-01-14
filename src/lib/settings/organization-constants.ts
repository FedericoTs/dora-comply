import { z } from 'zod';

/**
 * Organization Settings Constants and Schema
 */

// Schema
export const organizationSchema = z.object({
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

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// LEI validation result type
export interface LEIValidationResult {
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

export const ENTITY_TYPE_LABELS: Record<string, { label: string; description: string }> = {
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

export const EU_JURISDICTIONS = [
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
] as const;

export type SignificanceLevel = 'significant' | 'non_significant' | 'simplified';

export const DEFAULT_FORM_VALUES: OrganizationFormData = {
  name: '',
  lei: '',
  entityType: 'financial_entity',
  jurisdiction: 'EU',
  significanceLevel: 'non_significant',
  significanceRationale: '',
  employeeCount: '',
  totalAssetsEur: '',
  annualGrossPremiumEur: '',
};
