'use client';

/**
 * SOC 2 Analysis Card
 *
 * Component for AI-powered SOC 2 report parsing:
 * 1. Trigger SOC 2 parsing for PDF documents
 * 2. Show parsing progress and results
 * 3. Display control extraction summary
 * 4. Link to full analysis view
 *
 * This is 10X better than competitors because:
 * - Extracts ALL Trust Services Criteria controls
 * - Identifies exceptions with impact assessment
 * - Maps to DORA requirements automatically
 * - Detects 4th party (subservice orgs) for supply chain risk
 */

import { useSOC2Analysis } from './use-soc2-analysis';
import { NotAvailableCard } from './not-available-card';
import { IdleCard } from './idle-card';
import { AnalyzingCard } from './analyzing-card';
import { FailedCard } from './failed-card';
import { CompletedCard } from './completed-card';
import type { SOC2AnalysisCardProps } from './types';

export function SOC2AnalysisCard({
  documentId,
  documentType,
  mimeType,
  vendorId,
  existingAnalysis,
}: SOC2AnalysisCardProps) {
  const {
    analysisState,
    analysis,
    error,
    progress,
    statusMessage,
    isPolling,
    isPending,
    isPdf,
    isSOC2,
    handleAnalyze,
  } = useSOC2Analysis({
    documentId,
    documentType,
    mimeType,
    existingAnalysis,
  });

  // Not a PDF or not SOC 2 - show info message
  if (!isPdf || !isSOC2) {
    return <NotAvailableCard isPdf={isPdf} />;
  }

  // Idle state - ready to analyze
  if (analysisState === 'idle' && !analysis) {
    return <IdleCard isPending={isPending} onAnalyze={handleAnalyze} />;
  }

  // Analyzing state
  if (analysisState === 'analyzing') {
    return (
      <AnalyzingCard
        progress={progress}
        statusMessage={statusMessage}
        isPolling={isPolling}
      />
    );
  }

  // Failed state
  if (analysisState === 'failed') {
    return (
      <FailedCard error={error} isPending={isPending} onRetry={handleAnalyze} />
    );
  }

  // Completed state - show results summary
  if (analysis) {
    return (
      <CompletedCard
        documentId={documentId}
        vendorId={vendorId}
        analysis={analysis}
      />
    );
  }

  return null;
}
