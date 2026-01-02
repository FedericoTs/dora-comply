/**
 * IAF CertSearch Integration
 *
 * IAF CertSearch is the official database of the International Accreditation Forum
 * for verified ISO management system certifications.
 *
 * Website: https://www.iafcertsearch.org/
 *
 * Note: IAF CertSearch doesn't have a public API, so this implementation
 * provides a structured interface for manual verification or future API access.
 * For now, we'll provide links to the search interface.
 */

export interface Certification {
  id: string;
  standard: string; // ISO 27001, ISO 9001, etc.
  standardVersion?: string; // 2022, 2015, etc.
  certificationBody: string;
  validFrom?: string;
  validUntil?: string;
  status: 'valid' | 'expired' | 'suspended' | 'withdrawn' | 'unknown';
  scope?: string;
  accreditationBody?: string;
  certificateNumber?: string;
  verified: boolean;
  verifiedAt?: string;
  source: 'iaf_certsearch' | 'manual' | 'vendor_provided';
}

export interface CertificationResult {
  companyName: string;
  certifications: Certification[];
  checkedAt: string;
  searchUrl: string;
  verified: boolean;
}

// Common ISO standards relevant for ICT providers
export const ISO_STANDARDS = {
  'ISO 27001': {
    name: 'Information Security Management',
    description: 'Establishes, implements, maintains, and continually improves an information security management system.',
    relevance: 'critical',
  },
  'ISO 27017': {
    name: 'Cloud Security',
    description: 'Security controls for cloud services.',
    relevance: 'critical',
  },
  'ISO 27018': {
    name: 'Cloud Privacy',
    description: 'Protection of personally identifiable information (PII) in cloud computing.',
    relevance: 'critical',
  },
  'ISO 22301': {
    name: 'Business Continuity Management',
    description: 'Establishes, implements, maintains, and continually improves a business continuity management system.',
    relevance: 'high',
  },
  'ISO 9001': {
    name: 'Quality Management',
    description: 'Demonstrates ability to consistently provide products and services that meet customer requirements.',
    relevance: 'medium',
  },
  'ISO 20000-1': {
    name: 'IT Service Management',
    description: 'Establishes, implements, maintains, and continually improves a service management system.',
    relevance: 'medium',
  },
  'ISO 14001': {
    name: 'Environmental Management',
    description: 'Provides framework for environmental management system.',
    relevance: 'low',
  },
  'SOC 2': {
    name: 'Service Organization Controls',
    description: 'Trust services criteria for security, availability, processing integrity, confidentiality, and privacy.',
    relevance: 'critical',
  },
} as const;

export type ISOStandard = keyof typeof ISO_STANDARDS;

/**
 * Generate a search URL for IAF CertSearch
 *
 * @param companyName - The company name to search for
 * @param country - Optional ISO country code
 * @returns URL to search IAF CertSearch
 */
export function generateIAFSearchUrl(companyName: string, country?: string): string {
  const baseUrl = 'https://www.iafcertsearch.org/organizations';
  const params = new URLSearchParams();

  // IAF CertSearch uses specific parameter format
  params.append('name', companyName);
  if (country) {
    params.append('country', country);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Create a certification result structure for manual verification
 *
 * Since IAF CertSearch doesn't have a public API, this creates a
 * placeholder result with the search URL for manual verification.
 *
 * @param companyName - The company name
 * @param country - Optional country code
 * @returns Certification result with search URL
 */
export function createCertificationCheckResult(
  companyName: string,
  country?: string
): CertificationResult {
  return {
    companyName,
    certifications: [],
    checkedAt: new Date().toISOString(),
    searchUrl: generateIAFSearchUrl(companyName, country),
    verified: false,
  };
}

/**
 * Add a manually verified certification to a result
 *
 * @param result - The certification result to update
 * @param certification - The certification details
 * @returns Updated certification result
 */
export function addVerifiedCertification(
  result: CertificationResult,
  certification: Omit<Certification, 'id' | 'verified' | 'verifiedAt' | 'source'>
): CertificationResult {
  const newCert: Certification = {
    ...certification,
    id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    verified: true,
    verifiedAt: new Date().toISOString(),
    source: 'iaf_certsearch',
  };

  return {
    ...result,
    certifications: [...result.certifications, newCert],
    verified: true,
  };
}

/**
 * Check if a certification is valid (not expired or suspended)
 */
export function isCertificationValid(cert: Certification): boolean {
  if (cert.status !== 'valid') return false;

  if (cert.validUntil) {
    const expiryDate = new Date(cert.validUntil);
    if (expiryDate < new Date()) return false;
  }

  return true;
}

/**
 * Get the relevance level of an ISO standard for ICT due diligence
 */
export function getStandardRelevance(standard: string): 'critical' | 'high' | 'medium' | 'low' | 'unknown' {
  const normalized = standard.toUpperCase().replace(/[:\-\s]+/g, ' ').trim();

  for (const [key, value] of Object.entries(ISO_STANDARDS)) {
    if (normalized.includes(key.replace(/[:\-\s]+/g, ' '))) {
      return value.relevance;
    }
  }

  return 'unknown';
}

/**
 * Get the standard info for display
 */
export function getStandardInfo(standard: string): {
  name: string;
  description: string;
  relevance: string;
} | null {
  const normalized = standard.toUpperCase();

  for (const [key, value] of Object.entries(ISO_STANDARDS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Format certification status for display
 */
export function formatCertificationStatus(cert: Certification): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'muted';
  description: string;
} {
  switch (cert.status) {
    case 'valid':
      if (cert.validUntil) {
        const daysUntilExpiry = Math.floor(
          (new Date(cert.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
        return {
          label: 'Valid',
          color: 'success',
          description: `Valid until ${new Date(cert.validUntil).toLocaleDateString()}`,
        };
      }
      return {
        label: 'Valid',
        color: 'success',
        description: 'Certificate is currently valid',
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

    default:
      return {
        label: 'Unknown',
        color: 'muted',
        description: 'Status could not be verified',
      };
  }
}

/**
 * Get DORA-relevant certifications from a list
 */
export function getDORARelevantCertifications(certs: Certification[]): Certification[] {
  const relevantStandards = ['ISO 27001', 'ISO 27017', 'ISO 27018', 'ISO 22301', 'SOC 2'];

  return certs.filter(cert => {
    const normalized = cert.standard.toUpperCase();
    return relevantStandards.some(std =>
      normalized.includes(std.replace(/\s+/g, ''))
    );
  });
}
