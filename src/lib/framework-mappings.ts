/**
 * Framework Mappings
 *
 * Maps frameworks to relevant data types for filtering.
 * Used to show framework-specific views of general data.
 */

import type { FrameworkCode } from '@/lib/licensing/types';
import type { DocumentType } from '@/lib/documents/types';

// ============================================
// DOCUMENT TYPE TO FRAMEWORK MAPPING
// ============================================

/**
 * Maps document types to the frameworks they're relevant for.
 * A document can be relevant to multiple frameworks.
 */
export const DOCUMENT_FRAMEWORK_RELEVANCE: Record<DocumentType, FrameworkCode[]> = {
  soc2: ['dora', 'iso27001'],           // SOC 2 supports DORA TPRM and maps to ISO controls
  iso27001: ['nis2', 'iso27001'],       // ISO 27001 is core to NIS2 and obviously ISO
  pentest: ['dora', 'nis2', 'iso27001'], // Pentests support all security frameworks
  contract: ['dora', 'nis2', 'gdpr'],   // Contracts are needed for DORA Art.30, NIS2 supply chain, GDPR DPAs
  other: ['dora', 'nis2', 'gdpr', 'iso27001'], // Other docs can apply to any
};

/**
 * Maps frameworks to their relevant document types.
 * Used for filtering documents by active framework.
 */
export const FRAMEWORK_DOCUMENT_TYPES: Record<FrameworkCode, DocumentType[]> = {
  dora: ['soc2', 'pentest', 'contract', 'other'],
  nis2: ['iso27001', 'pentest', 'contract', 'other'],
  gdpr: ['contract', 'other'],
  iso27001: ['soc2', 'iso27001', 'pentest', 'other'],
};

/**
 * Get document types relevant to a specific framework
 */
export function getDocumentTypesForFramework(framework: FrameworkCode): DocumentType[] {
  return FRAMEWORK_DOCUMENT_TYPES[framework] || ['other'];
}

/**
 * Check if a document type is relevant to a framework
 */
export function isDocumentRelevantToFramework(
  documentType: DocumentType,
  framework: FrameworkCode
): boolean {
  return DOCUMENT_FRAMEWORK_RELEVANCE[documentType]?.includes(framework) ?? false;
}

// ============================================
// INCIDENT FRAMEWORK RELEVANCE
// ============================================

/**
 * Incident types and their framework relevance.
 * Incidents are primarily DORA-focused but NIS2 also has incident reporting.
 */
export const INCIDENT_FRAMEWORK_RELEVANCE: Record<FrameworkCode, {
  relevant: boolean;
  description: string;
  reportingDeadlines?: string[];
}> = {
  dora: {
    relevant: true,
    description: 'ICT-related incidents under DORA Article 19',
    reportingDeadlines: ['4 hours (initial)', '72 hours (intermediate)', '1 month (final)'],
  },
  nis2: {
    relevant: true,
    description: 'Significant incidents under NIS2 Article 23',
    reportingDeadlines: ['24 hours (early warning)', '72 hours (notification)', '1 month (final)'],
  },
  gdpr: {
    relevant: true,
    description: 'Personal data breaches under GDPR Article 33-34',
    reportingDeadlines: ['72 hours (to authority)', 'Without undue delay (to individuals)'],
  },
  iso27001: {
    relevant: true,
    description: 'Information security incidents under ISO 27001 A.16',
    reportingDeadlines: ['As per incident response procedure'],
  },
};

/**
 * Check if incidents are relevant for a framework
 */
export function areIncidentsRelevantToFramework(framework: FrameworkCode): boolean {
  return INCIDENT_FRAMEWORK_RELEVANCE[framework]?.relevant ?? false;
}

// ============================================
// VENDOR/THIRD-PARTY FRAMEWORK RELEVANCE
// ============================================

/**
 * Third-party management relevance per framework.
 * All frameworks have some third-party requirements.
 */
export const VENDOR_FRAMEWORK_CONTEXT: Record<FrameworkCode, {
  title: string;
  focus: string;
  keyRequirements: string[];
}> = {
  dora: {
    title: 'ICT Third-Party Risk Management',
    focus: 'DORA Articles 28-30, 33-44',
    keyRequirements: [
      'ICT third-party service provider register',
      'Contractual arrangements (Art. 30)',
      'Critical provider oversight (Art. 33-44)',
      'Concentration risk assessment',
    ],
  },
  nis2: {
    title: 'Supply Chain Security',
    focus: 'NIS2 Article 21(2)(d)',
    keyRequirements: [
      'Supply chain security measures',
      'Supplier security requirements',
      'Vulnerability handling in suppliers',
      'Security of network/information systems',
    ],
  },
  gdpr: {
    title: 'Data Processor Management',
    focus: 'GDPR Article 28',
    keyRequirements: [
      'Data processing agreements',
      'Sub-processor authorization',
      'Cross-border transfer safeguards',
      'Processor security measures',
    ],
  },
  iso27001: {
    title: 'Supplier Relationships',
    focus: 'ISO 27001 Annex A.15',
    keyRequirements: [
      'Information security in supplier agreements',
      'Supplier service delivery management',
      'ICT supply chain security',
      'Monitoring and review of supplier services',
    ],
  },
};

/**
 * Get vendor context for a specific framework
 */
export function getVendorContextForFramework(framework: FrameworkCode) {
  return VENDOR_FRAMEWORK_CONTEXT[framework];
}
