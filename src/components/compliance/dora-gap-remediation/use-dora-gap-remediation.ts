'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DORA_REQUIREMENTS } from '@/lib/compliance/dora-requirements-data';
import type { DORAPillar } from '@/lib/compliance/dora-types';
import type { DORAEvidence, RequirementWithEvidence, ComplianceStats } from './types';

interface UseDORAGapRemediationProps {
  vendorId: string;
  soc2CoverageByRequirement: Record<string, 'full' | 'partial' | 'none'>;
}

export function useDORAGapRemediation({
  vendorId,
  soc2CoverageByRequirement,
}: UseDORAGapRemediationProps) {
  const [evidence, setEvidence] = useState<DORAEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillars, setExpandedPillars] = useState<Set<DORAPillar>>(new Set());

  // Fetch existing evidence
  useEffect(() => {
    async function fetchEvidence() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('dora_evidence')
        .select('*')
        .eq('vendor_id', vendorId)
        .neq('status', 'rejected');

      if (error) {
        console.error('Error fetching evidence:', error);
      } else {
        setEvidence(data || []);
      }
      setLoading(false);
    }

    fetchEvidence();
  }, [vendorId]);

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

  const addEvidence = useCallback((newEvidence: DORAEvidence) => {
    setEvidence((prev) => [...prev, newEvidence]);
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
