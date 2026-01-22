'use client';

import { useState, useCallback, useMemo } from 'react';
import { DORA_REQUIREMENTS } from '@/lib/compliance/dora-requirements-data';
import type { DORAPillar } from '@/lib/compliance/dora-types';
import type { DORAEvidence, RequirementWithEvidence, ComplianceStats } from './types';

interface UseDORAGapRemediationProps {
  vendorId: string;
  soc2CoverageByRequirement: Record<string, 'full' | 'partial' | 'none'>;
}

export function useDORAGapRemediation({
  vendorId: _vendorId,
  soc2CoverageByRequirement,
}: UseDORAGapRemediationProps) {
  // Note: dora_evidence table removed - manual evidence feature not yet implemented
  // Evidence will always be empty until a new evidence system is built
  const evidence: DORAEvidence[] = [];
  const loading = false;
  const [expandedPillars, setExpandedPillars] = useState<Set<DORAPillar>>(new Set());

  // Group requirements by pillar and add evidence
  const requirementsByPillar = useMemo(() => {
    return DORA_REQUIREMENTS.reduce<Record<DORAPillar, RequirementWithEvidence[]>>(
      (acc, req) => {
        const soc2Coverage = soc2CoverageByRequirement[req.id] || 'none';
        const manualEvidence = evidence.filter((e) => e.requirement_id === req.id);
        const hasVerifiedEvidence = manualEvidence.some((e) => e.status === 'verified');
        const hasPendingEvidence = manualEvidence.some((e) => e.status === 'pending');

        let overallStatus: 'covered' | 'partial' | 'gap' = 'gap';
        if (soc2Coverage === 'full' || hasVerifiedEvidence) {
          overallStatus = 'covered';
        } else if (soc2Coverage === 'partial' || hasPendingEvidence) {
          overallStatus = 'partial';
        }

        const reqWithEvidence: RequirementWithEvidence = {
          ...req,
          soc2Coverage,
          manualEvidence,
          overallStatus,
        };

        if (!acc[req.pillar]) acc[req.pillar] = [];
        acc[req.pillar].push(reqWithEvidence);
        return acc;
      },
      {} as Record<DORAPillar, RequirementWithEvidence[]>
    );
  }, [soc2CoverageByRequirement, evidence]);

  // Calculate stats
  const stats = useMemo<ComplianceStats>(() => {
    const totalRequirements = DORA_REQUIREMENTS.length;
    const allRequirements = Object.values(requirementsByPillar).flat();
    const coveredCount = allRequirements.filter((r) => r.overallStatus === 'covered').length;
    const partialCount = allRequirements.filter((r) => r.overallStatus === 'partial').length;
    const gapCount = totalRequirements - coveredCount - partialCount;
    const coveragePercentage = Math.round((coveredCount / totalRequirements) * 100);

    return {
      totalRequirements,
      coveredCount,
      partialCount,
      gapCount,
      coveragePercentage,
    };
  }, [requirementsByPillar]);

  const togglePillar = useCallback((pillar: DORAPillar) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(pillar)) {
        next.delete(pillar);
      } else {
        next.add(pillar);
      }
      return next;
    });
  }, []);

  // No-op until evidence feature is implemented
  const addEvidence = useCallback((_newEvidence: DORAEvidence) => {
    console.warn('Evidence feature not yet implemented');
  }, []);

  return {
    evidence,
    loading,
    expandedPillars,
    requirementsByPillar,
    stats,
    togglePillar,
    addEvidence,
  };
}
