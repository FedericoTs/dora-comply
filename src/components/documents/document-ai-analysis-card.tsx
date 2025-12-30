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

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Zap,
  Link as LinkIcon,
  Plus,
  Brain,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { analyzeContractDocument, applySignedOffAnalysisToContract } from '@/lib/ai/actions';
import type { ParsedContractRecord } from '@/lib/ai/types';
import type { Contract } from '@/lib/contracts/types';
import { ContractAnalysisResults } from './contract-analysis-results';
import { AnalysisSignOffDialog } from './analysis-sign-off-dialog';

interface DocumentAIAnalysisCardProps {
  documentId: string;
  documentType: string;
  mimeType: string;
  vendorId?: string | null;
  vendorName?: string | null;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string | null;
  existingAnalysis?: ParsedContractRecord | null;
  vendorContracts?: Contract[];
}

type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'failed';

export function DocumentAIAnalysisCard({
  documentId,
  documentType,
  mimeType,
  vendorId,
  vendorName,
  parsingStatus: initialParsingStatus,
  parsingError,
  existingAnalysis,
  vendorContracts = [],
}: DocumentAIAnalysisCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisState, setAnalysisState] = useState<AnalysisState>(
    existingAnalysis ? 'completed' : initialParsingStatus === 'processing' ? 'analyzing' : 'idle'
  );
  const [analysis, setAnalysis] = useState<ParsedContractRecord | null>(existingAnalysis || null);
  const [error, setError] = useState<string | null>(parsingError || null);
  const [progress, setProgress] = useState(0);

  // Dialogs
  const [showResults, setShowResults] = useState(false);
  const [showSignOff, setShowSignOff] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  const isPdf = mimeType === 'application/pdf';
  const isContract = documentType === 'contract';
  const canAnalyze = isPdf && analysisState === 'idle';
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

  const handleAnalyze = () => {
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
  };

  const handleApplyToContract = () => {
    if (!selectedContractId || !analysis) return;

    startTransition(async () => {
      const result = await applySignedOffAnalysisToContract(
        analysis.id,
        selectedContractId,
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
  };

  const handleSignOffComplete = () => {
    // Refresh the analysis data
    router.refresh();
    // Update local state
    if (analysis) {
      setAnalysis({ ...analysis, review_confirmed: true });
    }
  };

  // Not a PDF - show info message
  if (!isPdf) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <div>
              <p className="font-medium">PDF Required</p>
              <p className="text-sm">
                AI analysis is available for PDF contract documents.
                Upload a PDF version to enable DORA clause extraction.
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
            AI-Powered DORA Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Extract DORA Provisions Automatically</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Claude AI will analyze this contract and extract all DORA Article 30
                  provisions, identify compliance gaps, and flag risks.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    8 Article 30.2 provisions (all contracts)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    8 Article 30.3 provisions (critical functions)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Risk flags &amp; compliance gaps
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Analyze with AI
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Analysis typically takes 15-30 seconds depending on document length
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
            Analyzing Contract...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress < 20 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              <span>Extracting text from PDF</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress < 40 ? (
                <Clock className="h-4 w-4" />
              ) : progress < 80 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              <span>Analyzing DORA Article 30 provisions</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {progress < 80 ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Identifying risks and gaps</span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Claude is reading your contract and extracting DORA provisions...
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

          <Button onClick={handleAnalyze} variant="outline" className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completed state - show results summary
  if (analysis) {
    const complianceScore = analysis.overall_compliance_score || 0;
    const riskCount = analysis.risk_flags?.length || 0;
    const gapCount = analysis.compliance_gaps?.length || 0;

    return (
      <>
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                AI Analysis Complete
              </CardTitle>
              {isSignedOff ? (
                <Badge variant="outline" className="border-success text-success gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Signed Off
                </Badge>
              ) : (
                <Badge variant="outline" className="border-warning text-warning gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Review Required
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p
                  className={`text-2xl font-bold ${
                    complianceScore >= 80
                      ? 'text-success'
                      : complianceScore >= 50
                      ? 'text-warning'
                      : 'text-destructive'
                  }`}
                >
                  {complianceScore}%
                </p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-bold text-warning">{riskCount}</p>
                <p className="text-xs text-muted-foreground">Risks</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-2xl font-bold text-destructive">{gapCount}</p>
                <p className="text-xs text-muted-foreground">Gaps</p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="text-sm space-y-1.5 text-muted-foreground">
              {analysis.identified_contract_type && (
                <p>
                  <span className="font-medium text-foreground">Type:</span>{' '}
                  {analysis.identified_contract_type.replace(/_/g, ' ')}
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">Analyzed:</span>{' '}
                {new Date(analysis.extracted_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium text-foreground">AI Confidence:</span>{' '}
                {Math.round((analysis.confidence_score || 0) * 100)}%
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowResults(true)}
              >
                <Eye className="h-4 w-4" />
                View Full Analysis
              </Button>

              {!isSignedOff ? (
                <Button className="w-full gap-2" onClick={() => setShowSignOff(true)}>
                  <ShieldCheck className="h-4 w-4" />
                  Review &amp; Sign Off
                </Button>
              ) : vendorContracts.length > 0 ? (
                <Button className="w-full gap-2" onClick={() => setShowApplyDialog(true)}>
                  <LinkIcon className="h-4 w-4" />
                  Apply to Contract
                </Button>
              ) : vendorId ? (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => router.push(`/vendors/${vendorId}?tab=contracts`)}
                >
                  <Plus className="h-4 w-4" />
                  Create Contract
                </Button>
              ) : null}
            </div>

            {/* Sign-off info */}
            {isSignedOff && analysis.reviewer_name && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>
                  Signed off by <span className="font-medium">{analysis.reviewer_name}</span>
                  {analysis.reviewed_at && (
                    <> on {new Date(analysis.reviewed_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>DORA Compliance Analysis</DialogTitle>
              <DialogDescription>
                AI-extracted provisions and compliance assessment
              </DialogDescription>
            </DialogHeader>
            <ContractAnalysisResults
              analysis={analysis}
              showHeader={true}
              onSignOffComplete={handleSignOffComplete}
              contractId={selectedContractId || undefined}
              onApplyToContract={
                isSignedOff && vendorContracts.length > 0
                  ? () => setShowApplyDialog(true)
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>

        {/* Sign-off Dialog */}
        <AnalysisSignOffDialog
          open={showSignOff}
          onOpenChange={setShowSignOff}
          analysis={analysis}
          onSignOffComplete={handleSignOffComplete}
        />

        {/* Apply to Contract Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Analysis to Contract</DialogTitle>
              <DialogDescription>
                Select a contract to update with the extracted DORA provisions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Contract</label>
                <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a contract..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorContracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contract_ref} ({contract.contract_type.replace(/_/g, ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertDescription>
                  This will update the contract&apos;s DORA provisions with the AI-extracted
                  values. The compliance score and all provision statuses will be updated.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyToContract}
                disabled={!selectedContractId || isPending}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Apply to Contract
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
