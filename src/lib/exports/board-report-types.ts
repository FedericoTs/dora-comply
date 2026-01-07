/**
 * Board Reporting Export Types
 *
 * Type definitions for executive-level DORA compliance reports.
 * Used by both PDF and PowerPoint generators.
 */

export type DORAMaturityLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
export type DORAComplianceStatus = 'compliant' | 'partial' | 'non-compliant';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type VendorTier = 'critical' | 'important' | 'standard';

export interface BoardReportData {
  // Organization info
  organization: {
    name: string;
    logo?: string;
  };

  // Report metadata
  generatedAt: Date;
  reportingPeriod: {
    from: Date;
    to: Date;
  };

  // Executive Summary
  executiveSummary: {
    overallComplianceScore: number; // 0-100
    doraMaturityLevel: DORAMaturityLevel;
    criticalVendors: number;
    highRiskVendors: number;
    openIncidents: number;
    keyRisks: string[];
    recommendations: string[];
  };

  // DORA Compliance
  doraCompliance: {
    pillars: DORACompliancePillar[];
    criticalGaps: DORAGap[];
  };

  // Concentration Risk
  concentrationRisk: {
    hhiScore: number; // 0-10000 (Herfindahl-Hirschman Index)
    hhiCategory: 'low' | 'moderate' | 'high';
    geographicBreakdown: GeographicConcentration[];
    spofsCount: number; // Single Points of Failure
    fourthPartyDepth: number; // Max chain depth
    topRisks: string[];
  };

  // Vendor Summary
  vendorSummary: {
    total: number;
    byTier: {
      critical: number;
      important: number;
      standard: number;
    };
    byRisk: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    pendingAssessments: number;
    expiringContracts: number;
    contractsExpiringIn30Days: number;
  };

  // Action Items
  actionItems: ActionItem[];
}

export interface DORACompliancePillar {
  name: string;
  code: 'ICT_RISK' | 'INCIDENT' | 'RESILIENCE' | 'TPRM' | 'SHARING';
  coverage: number; // 0-100
  status: DORAComplianceStatus;
  controlsTotal: number;
  controlsImplemented: number;
}

export interface DORAGap {
  pillar: string;
  gap: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  remediationSuggestion?: string;
}

export interface GeographicConcentration {
  region: string;
  country?: string;
  percentage: number;
  vendorCount: number;
  riskLevel: RiskLevel;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'compliance' | 'risk' | 'vendor' | 'incident';
  dueDate?: Date;
  owner?: string;
}

// Color palette for exports
export const COLORS = {
  primary: [224, 122, 95] as [number, number, number], // #E07A5F
  primaryHex: '#E07A5F',
  success: [16, 185, 129] as [number, number, number], // #10B981
  successHex: '#10B981',
  warning: [245, 158, 11] as [number, number, number], // #F59E0B
  warningHex: '#F59E0B',
  error: [239, 68, 68] as [number, number, number], // #EF4444
  errorHex: '#EF4444',
  info: [59, 130, 246] as [number, number, number], // #3B82F6
  infoHex: '#3B82F6',
  gray: [107, 114, 128] as [number, number, number], // #6B7280
  grayHex: '#6B7280',
  dark: [17, 24, 39] as [number, number, number], // #111827
  darkHex: '#111827',
  white: [255, 255, 255] as [number, number, number],
  whiteHex: '#FFFFFF',
};

// Maturity level descriptions
export const MATURITY_LABELS: Record<DORAMaturityLevel, string> = {
  L0: 'Initial',
  L1: 'Developing',
  L2: 'Defined',
  L3: 'Managed',
  L4: 'Optimized',
};

// DORA Pillar full names
export const PILLAR_LABELS: Record<string, string> = {
  ICT_RISK: 'ICT Risk Management',
  INCIDENT: 'Incident Reporting',
  RESILIENCE: 'Resilience Testing',
  TPRM: 'Third-Party Risk Management',
  SHARING: 'Information Sharing',
};
