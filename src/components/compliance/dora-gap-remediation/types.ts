/**
 * DORA Gap Remediation Types
 */

import type { DORARequirement } from '@/lib/compliance/dora-types';

export interface DORAEvidence {
  id: string;
  requirement_id: string;
  evidence_type: 'document' | 'attestation' | 'link' | 'soc2_control';
  title: string;
  description?: string;
  external_link?: string;
  attested_by?: string;
  attested_at?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  valid_until?: string;
  created_at: string;
}

export interface RequirementWithEvidence extends DORARequirement {
  soc2Coverage: 'full' | 'partial' | 'none';
  manualEvidence: DORAEvidence[];
  overallStatus: 'covered' | 'partial' | 'gap';
}

export interface DORAGapRemediationProps {
  vendorId: string;
  vendorName: string;
  soc2CoverageByRequirement: Record<string, 'full' | 'partial' | 'none'>;
  className?: string;
}

export type CoverageStatus = 'covered' | 'partial' | 'gap';

export interface ComplianceStats {
  totalRequirements: number;
  coveredCount: number;
  partialCount: number;
  gapCount: number;
  coveragePercentage: number;
}
