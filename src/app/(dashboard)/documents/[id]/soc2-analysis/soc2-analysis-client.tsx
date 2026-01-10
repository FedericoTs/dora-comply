'use client';

/**
 * SOC 2 Analysis Client Component
 *
 * Client-side component for interactive charts:
 * - DORA Coverage Radar Chart (by pillar)
 * - DORA Evidence Coverage Donut Chart (replaces misleading "100% SOC 2 Effective")
 */

import { DORACoverageChart, DORAEvidenceChart, type DORAcoverageByPillar } from '@/components/compliance';

interface DORACoverage {
  overall: number;
  byPillar: DORAcoverageByPillar;
  gaps: string[];
}

interface DORAEvidence {
  sufficient: number;
  partial: number;
  insufficient: number;
  total: number;
  overallPercentage: number;
  criticalGapsCount: number;
}

interface SOC2AnalysisClientProps {
  doraCoverage: DORACoverage;
  doraEvidence: DORAEvidence;
}

export function SOC2AnalysisClient({
  doraCoverage,
  doraEvidence,
}: SOC2AnalysisClientProps) {
  return (
    <>
      {/* DORA Coverage Radar Chart - shows coverage by pillar */}
      <DORACoverageChart
        coverage={doraCoverage.byPillar}
        overallScore={doraCoverage.overall}
        gaps={doraCoverage.gaps}
        size="md"
        showLegend={false}
      />

      {/* DORA Evidence Coverage - shows how many requirements have evidence */}
      <DORAEvidenceChart
        sufficient={doraEvidence.sufficient}
        partial={doraEvidence.partial}
        insufficient={doraEvidence.insufficient}
        total={doraEvidence.total}
        overallPercentage={doraEvidence.overallPercentage}
        criticalGapsCount={doraEvidence.criticalGapsCount}
        size="md"
      />
    </>
  );
}
