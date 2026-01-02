'use client';

/**
 * SOC 2 Analysis Client Component
 *
 * Client-side component for interactive charts:
 * - DORA Coverage Radar Chart
 * - Control Status Donut Chart
 */

import { DORACoverageChart, type DORAcoverageByPillar } from '@/components/compliance';
import { ControlStatusChart } from '@/components/compliance';

interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  testingProcedure?: string;
  exceptionDescription?: string;
  location?: string;
  confidence: number;
}

interface DORACoverage {
  overall: number;
  byPillar: DORAcoverageByPillar;
  gaps: string[];
}

interface SOC2AnalysisClientProps {
  doraCoverage: DORACoverage;
  controlsEffective: number;
  controlsWithException: number;
  controlsNotTested: number;
  controls: ParsedControl[];
}

export function SOC2AnalysisClient({
  doraCoverage,
  controlsEffective,
  controlsWithException,
  controlsNotTested,
}: SOC2AnalysisClientProps) {
  return (
    <>
      {/* DORA Coverage Radar Chart */}
      <DORACoverageChart
        coverage={doraCoverage.byPillar}
        overallScore={doraCoverage.overall}
        gaps={doraCoverage.gaps}
        size="md"
        showLegend={false}
      />

      {/* Control Status Donut Chart */}
      <ControlStatusChart
        operatingEffectively={controlsEffective}
        withExceptions={controlsWithException}
        notTested={controlsNotTested}
        size="md"
      />
    </>
  );
}
