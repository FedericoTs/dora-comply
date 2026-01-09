/**
 * Entity Classification for DORA Proportionality
 *
 * Implements DORA's proportionality principle where requirements differ based on:
 * - Entity type (credit institution, investment firm, etc.)
 * - Significance level (significant entities require TLPT)
 * - Size (simplified framework for small entities under Art. 16)
 *
 * Reference: DORA Articles 4, 16, 26-27
 */

import type { EntityType, Organization } from '@/lib/auth/types';

// ============================================================================
// Types
// ============================================================================

export type SignificanceLevel = 'significant' | 'non_significant' | 'simplified';

export interface EntityClassification {
  entityType: EntityType;
  significanceLevel: SignificanceLevel;
  tlptRequired: boolean;
  simplifiedFramework: boolean;
  applicableArticles: string[];
  description: string;
}

export interface EntityTypeInfo {
  label: string;
  description: string;
  canBeSignificant: boolean;
  canUseSimplified: boolean;
  defaultArticles: string[];
}

// ============================================================================
// Entity Type Configuration
// ============================================================================

export const ENTITY_TYPE_INFO: Record<EntityType, EntityTypeInfo> = {
  financial_entity: {
    label: 'Financial Entity (Generic)',
    description: 'General financial entity under DORA scope',
    canBeSignificant: true,
    canUseSimplified: true,
    defaultArticles: ['5-15', '17-23', '28-30'],
  },
  credit_institution: {
    label: 'Credit Institution',
    description: 'Banks and other credit institutions under CRR/CRD',
    canBeSignificant: true,
    canUseSimplified: false, // Credit institutions cannot use simplified
    defaultArticles: ['5-15', '17-23', '28-30'],
  },
  investment_firm: {
    label: 'Investment Firm',
    description: 'Investment firms under MiFID II/MiFIR',
    canBeSignificant: true,
    canUseSimplified: true, // Small investment firms may qualify
    defaultArticles: ['5-15', '17-23', '28-30'],
  },
  insurance_undertaking: {
    label: 'Insurance Undertaking',
    description: 'Insurance and reinsurance undertakings under Solvency II',
    canBeSignificant: true,
    canUseSimplified: true, // Small insurers may qualify
    defaultArticles: ['5-15', '17-23', '28-30'],
  },
  payment_institution: {
    label: 'Payment Institution',
    description: 'Payment institutions under PSD2',
    canBeSignificant: false, // Payment institutions not typically designated significant
    canUseSimplified: true,
    defaultArticles: ['5-15', '17-23', '28-30'],
  },
  ict_service_provider: {
    label: 'ICT Third-Party Service Provider',
    description: 'ICT service providers (potentially CTPP under Art. 33-44)',
    canBeSignificant: false, // CTPP designation is different from entity significance
    canUseSimplified: false,
    defaultArticles: ['28-30', '33-44'], // CTPP-specific articles
  },
};

// ============================================================================
// Significance Thresholds (Indicative - actual thresholds set by regulators)
// ============================================================================

export const SIGNIFICANCE_THRESHOLDS = {
  // Total assets thresholds (EUR)
  credit_institution: {
    significant: 30_000_000_000, // €30B - indicative
  },
  investment_firm: {
    significant: 15_000_000_000, // €15B - indicative
  },
  insurance_undertaking: {
    significant: 10_000_000_000, // €10B gross premium - indicative
  },
  // Employee thresholds for simplified framework
  simplified_max_employees: 250,
  simplified_max_assets: 43_000_000, // €43M (SME definition)
};

// ============================================================================
// Classification Logic
// ============================================================================

/**
 * Classify an organization based on its entity type and significance designation
 */
export function classifyEntity(org: Organization): EntityClassification {
  const entityInfo = ENTITY_TYPE_INFO[org.entityType];

  // Determine significance level
  let significanceLevel: SignificanceLevel;
  if (org.simplifiedFrameworkEligible && entityInfo.canUseSimplified) {
    significanceLevel = 'simplified';
  } else if (org.isSignificant && entityInfo.canBeSignificant) {
    significanceLevel = 'significant';
  } else {
    significanceLevel = 'non_significant';
  }

  // TLPT is only required for significant entities (Art. 26-27)
  const tlptRequired = significanceLevel === 'significant';

  // Simplified framework applies to Art. 16 eligible entities
  const simplifiedFramework = significanceLevel === 'simplified';

  // Build applicable articles list
  const applicableArticles = [...entityInfo.defaultArticles];

  if (tlptRequired) {
    applicableArticles.push('26-27'); // TLPT articles
  }

  if (simplifiedFramework) {
    // Replace standard ICT risk articles with simplified version
    const index = applicableArticles.indexOf('5-15');
    if (index > -1) {
      applicableArticles[index] = '16'; // Simplified ICT risk management
    }
  }

  // Generate description
  const description = getClassificationDescription(significanceLevel, org.entityType);

  return {
    entityType: org.entityType,
    significanceLevel,
    tlptRequired,
    simplifiedFramework,
    applicableArticles,
    description,
  };
}

/**
 * Get human-readable description for the classification
 */
function getClassificationDescription(
  level: SignificanceLevel,
  entityType: EntityType
): string {
  const entityLabel = ENTITY_TYPE_INFO[entityType].label;

  switch (level) {
    case 'significant':
      return `${entityLabel} designated as significant. Subject to enhanced oversight including mandatory TLPT (Art. 26-27) every 3 years.`;
    case 'simplified':
      return `${entityLabel} eligible for simplified ICT risk management framework (Art. 16). Proportionate requirements apply.`;
    case 'non_significant':
    default:
      return `${entityLabel} with standard DORA requirements. Not subject to TLPT mandate but may conduct voluntary testing.`;
  }
}

/**
 * Check if an organization might qualify for simplified framework based on size
 */
export function checkSimplifiedEligibility(org: Organization): {
  eligible: boolean;
  reason: string;
} {
  const entityInfo = ENTITY_TYPE_INFO[org.entityType];

  if (!entityInfo.canUseSimplified) {
    return {
      eligible: false,
      reason: `${entityInfo.label} entities are not eligible for the simplified framework under DORA.`,
    };
  }

  // Check employee count
  if (org.employeeCount !== null) {
    if (org.employeeCount <= SIGNIFICANCE_THRESHOLDS.simplified_max_employees) {
      return {
        eligible: true,
        reason: `Organization has ${org.employeeCount} employees, below the ${SIGNIFICANCE_THRESHOLDS.simplified_max_employees} threshold.`,
      };
    }
  }

  // Check total assets
  if (org.totalAssetsEur !== null) {
    if (org.totalAssetsEur <= SIGNIFICANCE_THRESHOLDS.simplified_max_assets) {
      return {
        eligible: true,
        reason: `Organization has €${(org.totalAssetsEur / 1_000_000).toFixed(1)}M in assets, below the €43M threshold.`,
      };
    }
  }

  // If no size data provided, assume not eligible
  if (org.employeeCount === null && org.totalAssetsEur === null) {
    return {
      eligible: false,
      reason: 'Size information not provided. Please enter employee count or total assets to check eligibility.',
    };
  }

  return {
    eligible: false,
    reason: 'Organization exceeds SME thresholds for simplified framework.',
  };
}

/**
 * Check if an organization might be designated as significant based on size
 */
export function checkSignificanceIndicators(org: Organization): {
  mayBeSignificant: boolean;
  indicators: string[];
} {
  const indicators: string[] = [];
  const entityInfo = ENTITY_TYPE_INFO[org.entityType];

  if (!entityInfo.canBeSignificant) {
    return {
      mayBeSignificant: false,
      indicators: [`${entityInfo.label} entities are not typically designated as significant under DORA.`],
    };
  }

  // Check against thresholds based on entity type
  const thresholds = SIGNIFICANCE_THRESHOLDS[org.entityType as keyof typeof SIGNIFICANCE_THRESHOLDS];

  if (thresholds && typeof thresholds === 'object' && 'significant' in thresholds) {
    if (org.totalAssetsEur !== null && org.totalAssetsEur >= thresholds.significant) {
      indicators.push(
        `Total assets (€${(org.totalAssetsEur / 1_000_000_000).toFixed(1)}B) exceed significance threshold`
      );
    }
  }

  // Check gross premium for insurance
  if (org.entityType === 'insurance_undertaking' && org.annualGrossPremiumEur !== null) {
    const threshold = SIGNIFICANCE_THRESHOLDS.insurance_undertaking.significant;
    if (org.annualGrossPremiumEur >= threshold) {
      indicators.push(
        `Annual gross premium (€${(org.annualGrossPremiumEur / 1_000_000_000).toFixed(1)}B) exceeds significance threshold`
      );
    }
  }

  return {
    mayBeSignificant: indicators.length > 0,
    indicators: indicators.length > 0
      ? indicators
      : ['No significance indicators detected based on available data.'],
  };
}

// ============================================================================
// Article Descriptions
// ============================================================================

export const DORA_ARTICLE_DESCRIPTIONS: Record<string, string> = {
  '5-15': 'ICT Risk Management Framework',
  '16': 'Simplified ICT Risk Management Framework',
  '17-23': 'ICT-related Incident Management, Classification and Reporting',
  '24-25': 'Digital Operational Resilience Testing',
  '26-27': 'Threat-Led Penetration Testing (TLPT)',
  '28-30': 'Managing ICT Third-Party Risk',
  '33-44': 'Oversight Framework for Critical ICT Third-Party Providers',
};

/**
 * Get the list of applicable DORA articles with descriptions
 */
export function getApplicableArticlesWithDescriptions(
  classification: EntityClassification
): Array<{ articles: string; description: string }> {
  return classification.applicableArticles.map((articles) => ({
    articles,
    description: DORA_ARTICLE_DESCRIPTIONS[articles] || 'Unknown article range',
  }));
}
