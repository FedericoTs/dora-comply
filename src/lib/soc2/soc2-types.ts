/**
 * SOC 2 Analysis Types and Constants
 *
 * Shared types and configurations for SOC 2 analysis components.
 */

import { CheckCircle2, AlertTriangle, XCircle, type LucideIcon } from 'lucide-react';

// Parsed SOC 2 data types
export interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  testingProcedure?: string;
  exceptionDescription?: string;
  location?: string;
  pageRef?: number;
  confidence: number;
}

export interface ParsedException {
  controlId: string;
  controlArea?: string;
  exceptionDescription: string;
  exceptionType?: string;
  managementResponse?: string;
  remediationDate?: string;
  impact: 'low' | 'medium' | 'high';
  location?: string;
  pageRef?: number;
}

export interface ParsedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: 'inclusive' | 'carve_out';
  controlsSupported: string[];
  hasOwnSoc2?: boolean;
  location?: string;
  pageRef?: number;
}

export interface ParsedCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility: string;
  category?: string;
  location?: string;
  pageRef?: number;
}

export interface ConfidenceScores {
  overall: number;
  metadata: number;
  controls: number;
  exceptions: number;
  subserviceOrgs: number;
  cuecs: number;
}

export interface ParsedSOC2 {
  id: string;
  document_id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: OpinionType;
  period_start: string;
  period_end: string;
  criteria: string[];
  system_description: string;
  controls: ParsedControl[];
  exceptions: ParsedException[];
  subservice_orgs: ParsedSubserviceOrg[];
  cuecs: ParsedCUEC[];
  confidence_scores: ConfidenceScores;
  created_at: string;
}

// Opinion configuration
export type OpinionType = 'unqualified' | 'qualified' | 'adverse';

export interface OpinionConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const OPINION_CONFIG: Record<OpinionType, OpinionConfig> = {
  unqualified: {
    label: 'Unqualified Opinion',
    color: 'bg-success text-white',
    icon: CheckCircle2,
  },
  qualified: {
    label: 'Qualified Opinion',
    color: 'bg-warning text-white',
    icon: AlertTriangle,
  },
  adverse: {
    label: 'Adverse Opinion',
    color: 'bg-destructive text-white',
    icon: XCircle,
  },
};

// Control status badge configuration
export interface ControlStatusConfig {
  label: string;
  className: string;
  icon: LucideIcon;
}

export const CONTROL_STATUS_CONFIG: Record<ParsedControl['testResult'], ControlStatusConfig> = {
  operating_effectively: {
    label: 'Effective',
    className: 'border-success text-success',
    icon: CheckCircle2,
  },
  exception: {
    label: 'Exception',
    className: 'border-warning text-warning',
    icon: AlertTriangle,
  },
  not_tested: {
    label: 'Not Tested',
    className: '',
    icon: XCircle,
  },
};

// Helper to group controls by category
export function groupControlsByCategory(
  controls: ParsedControl[]
): Record<string, ParsedControl[]> {
  return controls.reduce<Record<string, ParsedControl[]>>((acc, control) => {
    const cat = control.tscCategory || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(control);
    return acc;
  }, {});
}

// Helper to calculate control statistics
export function calculateControlStats(controls: ParsedControl[]) {
  const effective = controls.filter((c) => c.testResult === 'operating_effectively').length;
  const withException = controls.filter((c) => c.testResult === 'exception').length;
  const notTested = controls.filter((c) => c.testResult === 'not_tested').length;
  const total = controls.length;
  const effectivenessRate = total > 0 ? Math.round((effective / total) * 100) : 0;

  return {
    effective,
    withException,
    notTested,
    total,
    effectivenessRate,
  };
}

// Impact badge styling helper
export function getImpactBadgeProps(impact: ParsedException['impact']) {
  switch (impact) {
    case 'high':
      return { variant: 'destructive' as const, className: '' };
    case 'medium':
      return { variant: 'outline' as const, className: 'border-warning text-warning' };
    default:
      return { variant: 'secondary' as const, className: '' };
  }
}
