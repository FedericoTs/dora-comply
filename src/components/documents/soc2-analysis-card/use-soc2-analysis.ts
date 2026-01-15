'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ParsedSOC2Summary, AnalysisState } from './types';

interface UseSOC2AnalysisProps {
  documentId: string;
  documentType: string;
  mimeType: string;
  existingAnalysis?: ParsedSOC2Summary | null;
}

export function useSOC2Analysis({ documentId, documentType, mimeType, existingAnalysis }: UseSOC2AnalysisProps) {
  const isPdf = mimeType === 'application/pdf';
  const isSOC2 = documentType === 'soc2';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisState, setAnalysisState] = useState<AnalysisState>(
    existingAnalysis ? 'completed' : 'idle'
  );
  const [analysis, setAnalysis] = useState<ParsedSOC2Summary | null>(
    existingAnalysis || null
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  // Poll for job completion - designed for Modal's async architecture
  const pollJobStatus = useCallback(async () => {
    setIsPolling(true);
    const maxAttempts = 120; // 10 minutes max (5s intervals) - Modal can take time
    let attempts = 0;
    let lastProgress = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      try {
        const response = await fetch(`/api/documents/${documentId}/parse-soc2`);
        const result = await response.json();

        if (result.status === 'complete' && result.parsedId) {
          // Parsing complete - update state and refresh page
          setProgress(100);
          setStatusMessage('Complete! Loading results...');
          setIsPolling(false);
          toast.success('SOC 2 Analysis Complete!', {
            description: 'Document has been parsed successfully.',
          });
          // Update state to completed and redirect to force full reload
          setAnalysisState('completed');
          // Use replace to force a full page reload with fresh data
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.reload();
          return;
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Parsing failed');
        } else {
          // Update progress - only increase, never decrease
          const newProgress = result.progress || 0;
          if (newProgress > lastProgress) {
            lastProgress = newProgress;
            setProgress(newProgress);
          }
          // Update status message from API
          if (result.message) {
            setStatusMessage(result.message);
          } else if (result.phase) {
            setStatusMessage(`Phase: ${result.phase}`);
          }
        }
      } catch (err) {
        // Don't fail on individual poll errors, just log
        console.error('[soc2-analysis-card] Poll error:', err);
      }
    }

    setIsPolling(false);
    throw new Error('Parsing timed out after 10 minutes. The document may still be processing - please refresh the page in a few minutes.');
  }, [documentId]);

  const handleAnalyze = useCallback(() => {
    setAnalysisState('analyzing');
    setProgress(5);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/parse-soc2`, {
          method: 'POST',
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Check if this is an async job (Modal parsing) or sync result
          if (result.jobId && !result.summary) {
            // Async case: Start polling for completion
            setProgress(10);
            try {
              await pollJobStatus();
            } catch (pollErr) {
              setError(pollErr instanceof Error ? pollErr.message : 'Polling failed');
              setAnalysisState('failed');
              toast.error('Analysis failed', {
                description: pollErr instanceof Error ? pollErr.message : 'Polling failed',
              });
            }
          } else if (result.summary) {
            // Sync case: Transform API response to component format
            setAnalysis({
              id: result.parsedId,
              report_type: result.summary.reportType,
              audit_firm: result.summary.auditFirm,
              opinion: result.summary.opinion,
              period_start: result.summary.periodStart,
              period_end: result.summary.periodEnd,
              criteria: result.summary.trustServicesCriteria,
              controls: Array(result.summary.totalControls).fill({}),
              exceptions: Array(result.summary.exceptionsCount).fill({}),
              subservice_orgs: Array(result.summary.subserviceOrgsCount).fill({}),
              cuecs: Array(result.summary.cuecsCount).fill({}),
              confidence_scores: {
                overall: result.summary.confidenceOverall,
                metadata: result.summary.confidenceOverall,
                controls: result.summary.confidenceOverall,
              },
              created_at: new Date().toISOString(),
            });
            setAnalysisState('completed');
            setProgress(100);
            toast.success('SOC 2 Analysis Complete!', {
              description: `Extracted ${result.summary.totalControls} controls from ${result.summary.auditFirm} report`,
            });
            router.refresh();
          } else {
            // Parsing already in progress message
            if (result.message === 'Parsing already in progress' && result.jobId) {
              setProgress(result.progress || 20);
              await pollJobStatus();
            } else {
              throw new Error('Unexpected response format');
            }
          }
        } else {
          setError(result.error || 'Analysis failed');
          setAnalysisState('failed');
          toast.error('Analysis failed', {
            description: result.error,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAnalysisState('failed');
        toast.error('Analysis failed');
      }
    });
  }, [documentId, pollJobStatus, router]);

  return {
    isPending,
    analysisState,
    analysis,
    error,
    progress,
    statusMessage,
    isPolling,
    isPdf,
    isSOC2,
    handleAnalyze,
  };
}
