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

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2,
  ChevronRight,
  Zap,
  Building2,
  AlertCircle,
  Eye,
  Network,
  Users,
  Database,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParsedSOC2Summary {
  id: string;
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: string;
  period_end: string;
  criteria: string[];
  controls: unknown[];
  exceptions: unknown[];
  subservice_orgs: unknown[];
  cuecs: unknown[];
  confidence_scores: {
    overall: number;
    metadata: number;
    controls: number;
  };
  created_at: string;
}

interface SOC2AnalysisCardProps {
  documentId: string;
  documentType: string;
  mimeType: string;
  vendorId?: string | null;
  vendorName?: string | null;
  existingAnalysis?: ParsedSOC2Summary | null;
}

type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

export function SOC2AnalysisCard({
  documentId,
  documentType,
  mimeType,
  vendorId,
  vendorName,
  existingAnalysis,
}: SOC2AnalysisCardProps) {
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

  const isPdf = mimeType === 'application/pdf';
  const isSOC2 = documentType === 'soc2';
  const canAnalyze = isPdf && isSOC2 && analysisState === 'idle';

  // Poll for job completion - designed for Modal's async architecture
  const pollJobStatus = async (jobId: string) => {
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
  };

  const handleAnalyze = () => {
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
              await pollJobStatus(result.jobId);
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
              await pollJobStatus(result.jobId);
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
  };

  // Not a PDF or not SOC 2 - show info message
  if (!isPdf || !isSOC2) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            SOC 2 Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <div>
              <p className="font-medium">
                {!isPdf ? 'PDF Required' : 'SOC 2 Document Required'}
              </p>
              <p className="text-sm">
                {!isPdf
                  ? 'Upload a PDF version of your SOC 2 report to enable AI parsing.'
                  : 'Mark this document as a SOC 2 report to enable AI parsing.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Idle state - ready to analyze
  if (analysisState === 'idle' && !analysis) {
    return (
      <Card className="card-elevated border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered SOC 2 Parsing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  Extract Controls &amp; Evidence Automatically
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Claude AI will parse your SOC 2 report and extract all Trust
                  Services Criteria controls, test results, and exceptions.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    64+ Trust Services Criteria controls (CC1-CC9)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Test results &amp; exceptions with impact
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Subservice organizations (4th party risk)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Automatic DORA compliance mapping
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            className="w-full gap-2"
            size="lg"
            disabled={isPending}
          >
            <Sparkles className="h-4 w-4" />
            Parse SOC 2 Report with AI
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Analysis typically takes 30-60 seconds depending on report length
          </p>
        </CardContent>
      </Card>
    );
  }

  // Analyzing state
  if (analysisState === 'analyzing') {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Parsing SOC 2 Report...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              <span className="text-sm">{statusMessage}</span>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress >= 10 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Uploading to processing queue</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress >= 30 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : progress >= 10 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Extracting text from PDF</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress >= 60 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : progress >= 30 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>AI analyzing controls &amp; exceptions</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress >= 90 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : progress >= 60 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Mapping to DORA requirements</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress >= 100 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : progress >= 90 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Saving results</span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {isPolling
              ? 'Processing via Modal.com - this may take a few minutes for large documents...'
              : 'Starting analysis...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Failed state
  if (analysisState === 'failed') {
    return (
      <Card className="card-elevated border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Unknown error occurred'}</AlertDescription>
          </Alert>

          <Button
            onClick={handleAnalyze}
            variant="outline"
            className="w-full gap-2"
            disabled={isPending}
          >
            <Sparkles className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completed state - show results summary
  if (analysis) {
    const controlsCount = analysis.controls?.length || 0;
    const exceptionsCount = analysis.exceptions?.length || 0;
    const subserviceCount = analysis.subservice_orgs?.length || 0;
    const cuecsCount = analysis.cuecs?.length || 0;
    const confidence = Math.round((analysis.confidence_scores?.overall || 0) * 100);

    const opinionBadge = {
      unqualified: { label: 'Clean Opinion', color: 'bg-success text-white' },
      qualified: { label: 'Qualified', color: 'bg-warning text-white' },
      adverse: { label: 'Adverse', color: 'bg-destructive text-white' },
    };

    return (
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              SOC 2 Analysis Complete
            </CardTitle>
            <Badge className={cn(opinionBadge[analysis.opinion]?.color)}>
              {opinionBadge[analysis.opinion]?.label || analysis.opinion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline">
                {analysis.report_type === 'type2' ? 'Type II' : 'Type I'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Audit Firm</span>
              <span className="text-sm font-medium">{analysis.audit_firm}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Period</span>
              <span className="text-sm">
                {new Date(analysis.period_start).toLocaleDateString()} -{' '}
                {new Date(analysis.period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Criteria</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {analysis.criteria?.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs capitalize">
                    {c.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-success">
                <Shield className="h-4 w-4" />
                <span className="text-2xl font-bold">{controlsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Controls Extracted</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div
                className={cn(
                  'flex items-center justify-center gap-2',
                  exceptionsCount > 0 ? 'text-warning' : 'text-success'
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-2xl font-bold">{exceptionsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Exceptions Found</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-info">
                <Network className="h-4 w-4" />
                <span className="text-2xl font-bold">{subserviceCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Subservice Orgs</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-2xl font-bold">{cuecsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">CUECs</p>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Confidence</span>
            <div className="flex items-center gap-2">
              <Progress value={confidence} className="w-20 h-2" />
              <span className="font-medium">{confidence}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full gap-2">
              <Link href={`/documents/${documentId}/soc2-analysis`}>
                <Eye className="h-4 w-4" />
                View Full Analysis
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            {vendorId && (
              <Button variant="outline" asChild className="w-full gap-2">
                <Link href={`/vendors/${vendorId}?tab=compliance`}>
                  <Building2 className="h-4 w-4" />
                  View DORA Mapping
                </Link>
              </Button>
            )}
          </div>

          {/* Next Step: Populate RoI CTA */}
          <div className="border-t pt-4 mt-2">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">Next Step: Populate Register of Information</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this SOC 2 data to auto-populate vendor details, subservice organizations,
                    and service functions in your DORA Register of Information.
                  </p>
                  <Button size="sm" className="mt-3 gap-2" asChild>
                    <Link href={`/roi?populateDoc=${documentId}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Populate RoI Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Parsed timestamp */}
          <p className="text-xs text-center text-muted-foreground">
            Parsed {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
