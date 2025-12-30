'use client';

/**
 * Contract Analysis Button
 *
 * Button to trigger AI-powered DORA compliance analysis on a document
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, Loader2, CheckCircle2, XCircle, FileSearch } from 'lucide-react';

interface ContractAnalysisButtonProps {
  documentId: string;
  contractId?: string;
  documentName: string;
  onAnalysisComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'failed';

export function ContractAnalysisButton({
  documentId,
  contractId,
  documentName,
  onAnalysisComplete,
  variant = 'outline',
  size = 'sm',
}: ContractAnalysisButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    overallScore: number;
    processingTime: number;
  } | null>(null);

  const handleAnalyze = async () => {
    setStatus('analyzing');
    setError(null);
    setProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 2000);

      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          includeCriticalProvisions: true,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Analysis failed');
      }

      setStatus('completed');
      setResult({
        overallScore: data.data.overall_compliance_score || 0,
        processingTime: data.data.processing_time_ms || 0,
      });

      toast.success('Contract analysis completed');
      onAnalysisComplete?.();
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Analysis failed', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      setError(null);
      setResult(null);
    }, 300);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {size !== 'icon' && 'AI Analysis'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              DORA Compliance Analysis
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of contract clauses against DORA Article 30 requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {status === 'idle' && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">Document</p>
                  <p className="text-sm text-muted-foreground truncate">{documentName}</p>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>The AI will analyze this contract for:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>DORA Article 30.2 provisions (8 mandatory clauses)</li>
                    <li>DORA Article 30.3 provisions (8 critical function clauses)</li>
                    <li>Key dates, financial terms, and risk flags</li>
                    <li>Compliance gaps with remediation suggestions</li>
                  </ul>
                </div>
              </div>
            )}

            {status === 'analyzing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {progress < 30 && 'Extracting text from document...'}
                  {progress >= 30 && progress < 70 && 'Analyzing contract clauses with AI...'}
                  {progress >= 70 && progress < 100 && 'Mapping provisions to DORA requirements...'}
                  {progress === 100 && 'Finalizing analysis...'}
                </p>
              </div>
            )}

            {status === 'completed' && result && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Analysis Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Processed in {(result.processingTime / 1000).toFixed(1)}s
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">DORA Compliance Score</span>
                    <span
                      className={`text-2xl font-bold ${
                        result.overallScore >= 80
                          ? 'text-success'
                          : result.overallScore >= 50
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}
                    >
                      {result.overallScore}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <XCircle className="h-16 w-16 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Analysis Failed</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {status === 'idle' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleAnalyze} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Analysis
                </Button>
              </>
            )}
            {status === 'analyzing' && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </Button>
            )}
            {(status === 'completed' || status === 'failed') && (
              <Button onClick={handleClose}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
