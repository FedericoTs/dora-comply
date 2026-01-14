'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { analyzeContractDocument, applySignedOffAnalysisToContract } from '@/lib/ai/actions';
import type { ParsedContractRecord, AnalysisState } from './types';

interface UseDocumentAnalysisProps {
  documentId: string;
  mimeType: string;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string | null;
  existingAnalysis?: ParsedContractRecord | null;
}

export function useDocumentAnalysis({
  documentId,
  mimeType,
  parsingStatus,
  parsingError,
  existingAnalysis,
}: UseDocumentAnalysisProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisState, setAnalysisState] = useState<AnalysisState>(
    existingAnalysis ? 'completed' : parsingStatus === 'processing' ? 'analyzing' : 'idle'
  );
  const [analysis, setAnalysis] = useState<ParsedContractRecord | null>(existingAnalysis || null);
  const [error, setError] = useState<string | null>(parsingError || null);
  const [progress, setProgress] = useState(0);

  // Dialog states
  const [showResults, setShowResults] = useState(false);
  const [showSignOff, setShowSignOff] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  const isPdf = mimeType === 'application/pdf';
  const isSignedOff = analysis?.review_confirmed === true;

  // Simulate progress during analysis
  useEffect(() => {
    if (analysisState === 'analyzing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [analysisState]);

  const handleAnalyze = useCallback(() => {
    setAnalysisState('analyzing');
    setProgress(5);
    setError(null);

    startTransition(async () => {
      try {
        const result = await analyzeContractDocument(documentId);

        if (result.success && result.data) {
          setAnalysis(result.data);
          setAnalysisState('completed');
          setProgress(100);
          toast.success('Analysis complete!', {
            description: `DORA compliance score: ${result.data.overall_compliance_score}%`,
          });
          router.refresh();
        } else {
          setError(result.error?.message || 'Analysis failed');
          setAnalysisState('failed');
          toast.error('Analysis failed', {
            description: result.error?.message,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAnalysisState('failed');
        toast.error('Analysis failed');
      }
    });
  }, [documentId, router]);

  const handleApplyToContract = useCallback((contractId: string) => {
    if (!contractId || !analysis) return;

    startTransition(async () => {
      const result = await applySignedOffAnalysisToContract(
        analysis.id,
        contractId,
        true
      );

      if (result.success) {
        toast.success('Analysis applied to contract', {
          description: 'DORA provisions have been updated',
        });
        setShowApplyDialog(false);
        router.refresh();
      } else {
        toast.error('Failed to apply analysis', {
          description: result.error?.message,
        });
      }
    });
  }, [analysis, router]);

  const handleSignOffComplete = useCallback(() => {
    router.refresh();
    if (analysis) {
      setAnalysis({ ...analysis, review_confirmed: true });
    }
  }, [analysis, router]);

  return {
    // State
    isPending,
    analysisState,
    analysis,
    error,
    progress,
    isPdf,
    isSignedOff,

    // Dialog states
    showResults,
    setShowResults,
    showSignOff,
    setShowSignOff,
    showApplyDialog,
    setShowApplyDialog,
    selectedContractId,
    setSelectedContractId,

    // Handlers
    handleAnalyze,
    handleApplyToContract,
    handleSignOffComplete,
  };
}
