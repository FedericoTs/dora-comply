/**
 * Vendor Certifications Types
 *
 * Types for managing ISO and compliance certifications
 */

export type CertificationStatus = 'valid' | 'expired' | 'suspended' | 'withdrawn' | 'pending';
export type VerificationMethod = 'manual' | 'iaf_certsearch' | 'vendor_provided';

export interface VendorCertification {
  id: string;
  vendor_id: string;
  organization_id: string;

  // Certification details
  standard: string;
  standard_version?: string | null;
  certificate_number?: string | null;

  // Certification body
  certification_body: string;
  accreditation_body?: string | null;

  // Validity
  valid_from: string;
  valid_until?: string | null;
  status: CertificationStatus;

  // Scope and details
  scope?: string | null;
  certificate_url?: string | null;

  // Verification
  verified: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  verification_method?: VerificationMethod | null;
  verification_notes?: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateCertificationInput {
  vendor_id: string;
  standard: string;
  standard_version?: string;
  certificate_number?: string;
  certification_body: string;
  accreditation_body?: string;
  valid_from: string;
  valid_until?: string;
  status?: CertificationStatus;
  scope?: string;
  certificate_url?: string;
  verified?: boolean;
  verification_method?: VerificationMethod;
  verification_notes?: string;
}

export interface UpdateCertificationInput {
  standard?: string;
  standard_version?: string;
  certificate_number?: string;
  certification_body?: string;
  accreditation_body?: string;
  valid_from?: string;
  valid_until?: string;
  status?: CertificationStatus;
  scope?: string;
  certificate_url?: string;
  verified?: boolean;
  verification_method?: VerificationMethod;
  verification_notes?: string;
}

// Common ISO standards relevant for ICT providers (DORA compliance)
export const ISO_STANDARDS = {
  'ISO 27001': {
    name: 'Information Security Management',
    description: 'Establishes, implements, maintains, and continually improves an information security management system.',
    relevance: 'critical' as const,
  },
  'ISO 27017': {
    name: 'Cloud Security',
    description: 'Security controls for cloud services.',
    relevance: 'critical' as const,
  },
  'ISO 27018': {
    name: 'Cloud Privacy',
    description: 'Protection of personally identifiable information (PII) in cloud computing.',
    relevance: 'critical' as const,
  },
  'ISO 22301': {
    name: 'Business Continuity Management',
    description: 'Establishes, implements, maintains, and continually improves a business continuity management system.',
    relevance: 'high' as const,
  },
  'ISO 9001': {
    name: 'Quality Management',
    description: 'Demonstrates ability to consistently provide products and services that meet customer requirements.',
    relevance: 'medium' as const,
  },
  'ISO 20000-1': {
    name: 'IT Service Management',
    description: 'Establishes, implements, maintains, and continually improves a service management system.',
    relevance: 'medium' as const,
  },
  'ISO 14001': {
    name: 'Environmental Management',
    description: 'Provides framework for environmental management system.',
    relevance: 'low' as const,
  },
  'SOC 2': {
    name: 'Service Organization Controls',
    description: 'Trust services criteria for security, availability, processing integrity, confidentiality, and privacy.',
    relevance: 'critical' as const,
  },
  'SOC 1': {
    name: 'Financial Reporting Controls',
    description: 'Controls relevant to financial reporting.',
    relevance: 'high' as const,
  },
  'CSA STAR': {
    name: 'Cloud Security Alliance STAR',
    description: 'Cloud-specific security certification.',
    relevance: 'high' as const,
  },
} as const;

export type ISOStandard = keyof typeof ISO_STANDARDS;

// Helper functions
export function getStandardRelevance(standard: string): 'critical' | 'high' | 'medium' | 'low' | 'unknown' {
  const normalized = standard.toUpperCase().replace(/[:\-\s]+/g, ' ').trim();
  for (const [key, value] of Object.entries(ISO_STANDARDS)) {
    if (normalized.includes(key.replace(/[:\-\s]+/g, ' '))) {
      return value.relevance;
    }
  }
  return 'unknown';
}

export function isCertificationExpiring(cert: VendorCertification, daysThreshold = 30): boolean {
  if (!cert.valid_until) return false;
  const expiryDate = new Date(cert.valid_until);
  const today = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

export function isCertificationExpired(cert: VendorCertification): boolean {
  if (!cert.valid_until) return false;
  return new Date(cert.valid_until) < new Date();
}

export function getCertificationStatusColor(status: CertificationStatus): string {
  const colors: Record<CertificationStatus, string> = {
    valid: 'text-success',
    expired: 'text-error',
    suspended: 'text-warning',
    withdrawn: 'text-error',
    pending: 'text-muted-foreground',
  };
  return colors[status];
}

export function formatCertificationStatus(cert: VendorCertification): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'muted';
  description: string;
} {
  // Check for expiry first
  if (cert.valid_until) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return {
        label: 'Expired',
        color: 'error',
        description: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      };
    }
    if (daysUntilExpiry < 30) {
      return {
        label: 'Expiring Soon',
        color: 'warning',
        description: `Expires in ${daysUntilExpiry} days`,
      };
    }
  }

  switch (cert.status) {
    case 'valid':
      return {
        label: 'Valid',
        color: 'success',
        description: cert.valid_until
          ? `Valid until ${new Date(cert.valid_until).toLocaleDateString()}`
          : 'Currently valid',
      };
    case 'expired':
      return {
        label: 'Expired',
        color: 'error',
        description: 'Certificate has expired',
      };
    case 'suspended':
      return {
        label: 'Suspended',
        color: 'error',
        description: 'Certificate has been suspended',
      };
    case 'withdrawn':
      return {
        label: 'Withdrawn',
        color: 'error',
        description: 'Certificate has been withdrawn',
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'muted',
        description: 'Certification is pending',
      };
    default:
      return {
        label: 'Unknown',
        color: 'muted',
        description: 'Status unknown',
      };
  }
}
