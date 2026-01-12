'use client';

/**
 * SOC 2 Analysis Client Component
 *
 * Client-side component for interactive charts:
 * - DORA Coverage Radar Chart (by pillar)
 * - DORA Evidence Coverage Donut Chart (replaces misleading "100% SOC 2 Effective")
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { DORAcoverageByPillar } from '@/components/compliance';

// Lazy load chart components - recharts is 7MB
const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-lg">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const DORACoverageChart = dynamic(
  () => import('@/components/compliance').then(mod => ({ default: mod.DORACoverageChart })),
  { ssr: false, loading: ChartLoadingFallback }
);

const DORAEvidenceChart = dynamic(
  () => import('@/components/compliance').then(mod => ({ default: mod.DORAEvidenceChart })),
  { ssr: false, loading: ChartLoadingFallback }
);

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
