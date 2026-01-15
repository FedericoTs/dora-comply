'use client';

/**
 * Document AI Analysis Card
 *
 * Comprehensive component for AI-powered contract analysis workflow:
 * 1. Trigger analysis for PDF documents
 * 2. Show analysis progress and results
 * 3. Handle sign-off workflow
 * 4. Apply results to contracts
 *
 * This is 10X better than competitors because:
 * - One-click analysis with real-time status
 * - Inline results preview
 * - Seamless sign-off workflow
 * - Smart contract linking
 */

import { useDocumentAnalysis } from './use-document-analysis';
import { NotAvailableCard } from './not-available-card';
import { IdleCard } from './idle-card';
import { AnalyzingCard } from './analyzing-card';
import { FailedCard } from './failed-card';
import { CompletedCard } from './completed-card';
import type { DocumentAIAnalysisCardProps } from './types';

export function DocumentAIAnalysisCard({
  documentId,
  mimeType,
  vendorId,
  vendorName,
  parsingStatus,
  parsingError,
  existingAnalysis,
  vendorContracts = [],
}: DocumentAIAnalysisCardProps) {
  const {
    isPending,
    analysisState,
    analysis,
    error,
    progress,
    isPdf,
    isSignedOff,
    showResults,
    setShowResults,
    showSignOff,
    setShowSignOff,
    showApplyDialog,
    setShowApplyDialog,
    selectedContractId,
    setSelectedContractId,
    handleAnalyze,
    handleApplyToContract,
    handleSignOffComplete,
  } = useDocumentAnalysis({
    documentId,
    mimeType,
    parsingStatus,
    parsingError,
    existingAnalysis,
  });

  // Not a PDF - show info message
  if (!isPdf) {
    return <NotAvailableCard />;
  }

  // Idle state - ready to analyze
  if (analysisState === 'idle' && !analysis) {
    return <IdleCard isPending={isPending} onAnalyze={handleAnalyze} />;
  }

  // Analyzing state
  if (analysisState === 'analyzing') {
    return <AnalyzingCard progress={progress} />;
  }

  // Failed state
  if (analysisState === 'failed') {
    return <FailedCard error={error} isPending={isPending} onRetry={handleAnalyze} />;
  }

  // Completed state - show results summary
  if (analysis) {
    return (
      <CompletedCard
        documentId={documentId}
        vendorId={vendorId}
        vendorName={vendorName}
        analysis={analysis}
        vendorContracts={vendorContracts}
        isSignedOff={isSignedOff}
        isPending={isPending}
        showResults={showResults}
        setShowResults={setShowResults}
        showSignOff={showSignOff}
        setShowSignOff={setShowSignOff}
        showApplyDialog={showApplyDialog}
        setShowApplyDialog={setShowApplyDialog}
        selectedContractId={selectedContractId}
        setSelectedContractId={setSelectedContractId}
        onSignOffComplete={handleSignOffComplete}
        onApplyToContract={() => handleApplyToContract(selectedContractId)}
      />
    );
  }

  return null;
}
