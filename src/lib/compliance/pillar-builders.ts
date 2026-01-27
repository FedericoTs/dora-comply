/**
 * Framework-Adaptive Pillar Builders
 *
 * Centralized factory for building CompliancePillar arrays based on
 * the selected framework. Maps framework-specific scoring data to
 * the unified CompliancePillar interface used by the dashboard.
 */

import type { FrameworkCode } from '@/lib/licensing/types';

// =============================================================================
// Types
// =============================================================================

export interface CompliancePillar {
  id: string;
  name: string;
  shortName: string;
  score: number;
  href?: string;
}

export interface DORAScores {
  ictRisk?: number;
  incidents?: number;
  testing?: number;
  tprm?: number;
  infoSharing?: number;
}

export interface NIS2Scores {
  governance?: number;
  risk_management?: number;
  incident_handling?: number;
  business_continuity?: number;
  supply_chain?: number;
  reporting?: number;
}

export interface GDPRScores {
  technical_measures?: number;
  organizational_measures?: number;
  risk_assessment?: number;
}

export interface ISO27001Scores {
  A5?: number;
  A6?: number;
  A7?: number;
  A8?: number;
}

// =============================================================================
// Pillar Configurations
// =============================================================================

/**
 * DORA Pillars - 5 pillars based on DORA regulation chapters
 */
const DORA_PILLAR_CONFIG = {
  ict_risk_management: {
    id: 'ict-risk',
    name: 'ICT Risk Management',
    shortName: 'ICT Risk Mgmt',
    href: '/compliance/trends?pillar=ict-risk',
  },
  incident_reporting: {
    id: 'incidents',
    name: 'Incident Management',
    shortName: 'Incident Mgmt',
    href: '/compliance/trends?pillar=incidents',
  },
  resilience_testing: {
    id: 'testing',
    name: 'Resilience Testing',
    shortName: 'Resilience',
    href: '/compliance/trends?pillar=testing',
  },
  third_party_risk: {
    id: 'tprm',
    name: 'Third Party Risk Management',
    shortName: 'TPRM',
    href: '/compliance/trends?pillar=tprm',
  },
  information_sharing: {
    id: 'info-sharing',
    name: 'Information Sharing',
    shortName: 'Info Sharing',
    href: '/compliance/trends?pillar=info-sharing',
  },
} as const;

/**
 * NIS2 Pillars - 6 categories based on NIS2 Article 21
 */
const NIS2_PILLAR_CONFIG = {
  governance: {
    id: 'governance',
    name: 'Governance & Accountability',
    shortName: 'Governance',
    href: '/nis2?tab=overview',
  },
  risk_management: {
    id: 'risk-management',
    name: 'Risk Management',
    shortName: 'Risk Mgmt',
    href: '/nis2/risk-register',
  },
  incident_handling: {
    id: 'incident-handling',
    name: 'Incident Handling',
    shortName: 'Incidents',
    href: '/incidents',
  },
  business_continuity: {
    id: 'business-continuity',
    name: 'Business Continuity',
    shortName: 'BCP/DR',
    href: '/nis2?tab=gaps&category=business_continuity',
  },
  supply_chain: {
    id: 'supply-chain',
    name: 'Supply Chain Security',
    shortName: 'Supply Chain',
    href: '/vendors',
  },
  reporting: {
    id: 'reporting',
    name: 'Incident Reporting',
    shortName: 'Reporting',
    href: '/incidents',
  },
} as const;

/**
 * GDPR Article 32 Pillars - 3 categories
 */
const GDPR_PILLAR_CONFIG = {
  technical_measures: {
    id: 'technical',
    name: 'Technical Measures',
    shortName: 'Technical',
    href: '/data-protection?category=technical',
  },
  organizational_measures: {
    id: 'organizational',
    name: 'Organizational Measures',
    shortName: 'Organizational',
    href: '/data-protection?category=organizational',
  },
  risk_assessment: {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    shortName: 'Risk Assessment',
    href: '/data-protection?category=risk',
  },
} as const;

/**
 * ISO 27001:2022 Pillars - 4 Annex A control themes
 */
const ISO27001_PILLAR_CONFIG = {
  A5: {
    id: 'organizational',
    name: 'Organizational Controls',
    shortName: 'Organizational',
    href: '/frameworks/iso27001?category=A5',
  },
  A6: {
    id: 'people',
    name: 'People Controls',
    shortName: 'People',
    href: '/frameworks/iso27001?category=A6',
  },
  A7: {
    id: 'physical',
    name: 'Physical Controls',
    shortName: 'Physical',
    href: '/frameworks/iso27001?category=A7',
  },
  A8: {
    id: 'technological',
    name: 'Technological Controls',
    shortName: 'Technological',
    href: '/frameworks/iso27001?category=A8',
  },
} as const;

// =============================================================================
// Pillar Builder Functions
// =============================================================================

/**
 * Build DORA pillars from score data
 */
export function buildDORAPillars(scores?: DORAScores): CompliancePillar[] {
  const config = DORA_PILLAR_CONFIG;
  return [
    {
      id: config.ict_risk_management.id,
      name: config.ict_risk_management.name,
      shortName: config.ict_risk_management.shortName,
      score: scores?.ictRisk ?? 0,
      href: config.ict_risk_management.href,
    },
    {
      id: config.incident_reporting.id,
      name: config.incident_reporting.name,
      shortName: config.incident_reporting.shortName,
      score: scores?.incidents ?? 0,
      href: config.incident_reporting.href,
    },
    {
      id: config.resilience_testing.id,
      name: config.resilience_testing.name,
      shortName: config.resilience_testing.shortName,
      score: scores?.testing ?? 0,
      href: config.resilience_testing.href,
    },
    {
      id: config.third_party_risk.id,
      name: config.third_party_risk.name,
      shortName: config.third_party_risk.shortName,
      score: scores?.tprm ?? 0,
      href: config.third_party_risk.href,
    },
    {
      id: config.information_sharing.id,
      name: config.information_sharing.name,
      shortName: config.information_sharing.shortName,
      score: scores?.infoSharing ?? 0,
      href: config.information_sharing.href,
    },
  ];
}

/**
 * Build NIS2 pillars from category scores
 */
export function buildNIS2Pillars(scores?: NIS2Scores): CompliancePillar[] {
  const config = NIS2_PILLAR_CONFIG;
  return [
    {
      id: config.governance.id,
      name: config.governance.name,
      shortName: config.governance.shortName,
      score: scores?.governance ?? 0,
      href: config.governance.href,
    },
    {
      id: config.risk_management.id,
      name: config.risk_management.name,
      shortName: config.risk_management.shortName,
      score: scores?.risk_management ?? 0,
      href: config.risk_management.href,
    },
    {
      id: config.incident_handling.id,
      name: config.incident_handling.name,
      shortName: config.incident_handling.shortName,
      score: scores?.incident_handling ?? 0,
      href: config.incident_handling.href,
    },
    {
      id: config.business_continuity.id,
      name: config.business_continuity.name,
      shortName: config.business_continuity.shortName,
      score: scores?.business_continuity ?? 0,
      href: config.business_continuity.href,
    },
    {
      id: config.supply_chain.id,
      name: config.supply_chain.name,
      shortName: config.supply_chain.shortName,
      score: scores?.supply_chain ?? 0,
      href: config.supply_chain.href,
    },
    {
      id: config.reporting.id,
      name: config.reporting.name,
      shortName: config.reporting.shortName,
      score: scores?.reporting ?? 0,
      href: config.reporting.href,
    },
  ];
}

/**
 * Build GDPR Article 32 pillars
 */
export function buildGDPRPillars(scores?: GDPRScores): CompliancePillar[] {
  const config = GDPR_PILLAR_CONFIG;
  return [
    {
      id: config.technical_measures.id,
      name: config.technical_measures.name,
      shortName: config.technical_measures.shortName,
      score: scores?.technical_measures ?? 0,
      href: config.technical_measures.href,
    },
    {
      id: config.organizational_measures.id,
      name: config.organizational_measures.name,
      shortName: config.organizational_measures.shortName,
      score: scores?.organizational_measures ?? 0,
      href: config.organizational_measures.href,
    },
    {
      id: config.risk_assessment.id,
      name: config.risk_assessment.name,
      shortName: config.risk_assessment.shortName,
      score: scores?.risk_assessment ?? 0,
      href: config.risk_assessment.href,
    },
  ];
}

/**
 * Build ISO 27001:2022 pillars from Annex A category scores
 */
export function buildISO27001Pillars(scores?: ISO27001Scores): CompliancePillar[] {
  const config = ISO27001_PILLAR_CONFIG;
  return [
    {
      id: config.A5.id,
      name: config.A5.name,
      shortName: config.A5.shortName,
      score: scores?.A5 ?? 0,
      href: config.A5.href,
    },
    {
      id: config.A6.id,
      name: config.A6.name,
      shortName: config.A6.shortName,
      score: scores?.A6 ?? 0,
      href: config.A6.href,
    },
    {
      id: config.A7.id,
      name: config.A7.name,
      shortName: config.A7.shortName,
      score: scores?.A7 ?? 0,
      href: config.A7.href,
    },
    {
      id: config.A8.id,
      name: config.A8.name,
      shortName: config.A8.shortName,
      score: scores?.A8 ?? 0,
      href: config.A8.href,
    },
  ];
}

// =============================================================================
// Unified Factory Function
// =============================================================================

type FrameworkScores = DORAScores | NIS2Scores | GDPRScores | ISO27001Scores;

/**
 * Build pillars for any supported framework
 */
export function buildPillarsForFramework(
  framework: FrameworkCode,
  scores?: FrameworkScores
): CompliancePillar[] {
  switch (framework) {
    case 'dora':
      return buildDORAPillars(scores as DORAScores | undefined);
    case 'nis2':
      return buildNIS2Pillars(scores as NIS2Scores | undefined);
    case 'gdpr':
      return buildGDPRPillars(scores as GDPRScores | undefined);
    case 'iso27001':
      return buildISO27001Pillars(scores as ISO27001Scores | undefined);
    default:
      return [];
  }
}

/**
 * Get framework-specific label for the compliance gauge
 */
export function getFrameworkGaugeLabel(framework: FrameworkCode): string {
  switch (framework) {
    case 'dora':
      return 'DORA Readiness';
    case 'nis2':
      return 'NIS2 Compliance';
    case 'gdpr':
      return 'GDPR Compliance';
    case 'iso27001':
      return 'ISO 27001 Compliance';
    default:
      return 'Compliance';
  }
}

/**
 * Get pillar count for a framework
 */
export function getPillarCount(framework: FrameworkCode): number {
  switch (framework) {
    case 'dora':
      return 5;
    case 'nis2':
      return 6;
    case 'gdpr':
      return 3;
    case 'iso27001':
      return 4;
    default:
      return 0;
  }
}

// =============================================================================
// Data Extraction Helpers
// =============================================================================

/**
 * Extract DORA scores from maturity snapshot
 */
export function extractDORAScores(snapshot: {
  pillar_ict_risk_mgmt_percent?: number;
  pillar_incident_reporting_percent?: number;
  pillar_resilience_testing_percent?: number;
  pillar_third_party_risk_percent?: number;
  pillar_info_sharing_percent?: number;
} | null): DORAScores {
  if (!snapshot) return {};
  return {
    ictRisk: snapshot.pillar_ict_risk_mgmt_percent,
    incidents: snapshot.pillar_incident_reporting_percent,
    testing: snapshot.pillar_resilience_testing_percent,
    tprm: snapshot.pillar_third_party_risk_percent,
    infoSharing: snapshot.pillar_info_sharing_percent,
  };
}

/**
 * Extract NIS2 scores from compliance result categories
 */
export function extractNIS2Scores(categories: Record<string, { percentage?: number }> | null): NIS2Scores {
  if (!categories) return {};
  return {
    governance: categories.governance?.percentage,
    risk_management: categories.risk_management?.percentage,
    incident_handling: categories.incident_handling?.percentage,
    business_continuity: categories.business_continuity?.percentage,
    supply_chain: categories.supply_chain?.percentage,
    reporting: categories.reporting?.percentage,
  };
}
