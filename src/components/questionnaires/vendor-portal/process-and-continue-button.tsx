'use client';

/**
 * ProcessAndContinueButton Component
 *
 * Triggers AI extraction before navigating to questions page.
 * This is the "magic" button that makes the aha moment happen!
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  Brain,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProcessAndContinueButtonProps {
  token: string;
  hasDocuments: boolean;
  hasUnprocessedDocuments: boolean;
}

type ProcessingStage = 'idle' | 'downloading' | 'analyzing' | 'extracting' | 'complete' | 'error';

const STAGE_MESSAGES: Record<ProcessingStage, string> = {
  idle: 'Ready to process',
  downloading: 'Downloading documents...',
  analyzing: 'AI is analyzing your documents...',
  extracting: 'Extracting answers from documents...',
  complete: 'Processing complete!',
  error: 'An error occurred',
};

const STAGE_ICONS: Record<ProcessingStage, typeof Sparkles> = {
  idle: Sparkles,
  downloading: FileText,
  analyzing: Brain,
  extracting: Zap,
  complete: CheckCircle2,
  error: Sparkles,
};

export function ProcessAndContinueButton({
  token,
  hasDocuments,
  hasUnprocessedDocuments,
}: ProcessAndContinueButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    processed: number;
    extracted: number;
    errors?: string[];
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  async function handleClick() {
    // If no documents or all processed, just navigate
    if (!hasDocuments || !hasUnprocessedDocuments) {
      router.push(`/q/${token}/questions`);
      return;
    }

    // Start processing
    setShowDialog(true);
    setIsProcessing(true);
    setStage('downloading');
    setProgress(10);

    try {
      // Simulate stage transitions for better UX
      const stageTimer = setTimeout(() => {
        setStage('analyzing');
        setProgress(30);
      }, 500);

      const extractTimer = setTimeout(() => {
        setStage('extracting');
        setProgress(60);
      }, 2000);

      // Call the process API
      const response = await fetch(`/api/vendor-portal/${token}/process`, {
        method: 'POST',
      });

      clearTimeout(stageTimer);
      clearTimeout(extractTimer);

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();

      setProgress(100);
      setStage('complete');
      setResult({
        processed: data.processed || 0,
        extracted: data.extracted || 0,
        errors: data.errors,
      });
    } catch (error) {
      console.error('Processing error:', error);
      setStage('error');
      setResult({
        processed: 0,
        extracted: 0,
        errors: ['Failed to process documents. You can still fill out the questionnaire manually.'],
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleContinue() {
    setShowDialog(false);
    router.push(`/q/${token}/questions`);
  }

  const StageIcon = STAGE_ICONS[stage];

  return (
    <>
      <Button onClick={handleClick} disabled={isProcessing}>
        {hasDocuments && hasUnprocessedDocuments ? (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Process & Continue
          </>
        ) : hasDocuments ? (
          <>
            Continue to Questions
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        ) : (
          <>
            Skip to Questions
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stage === 'complete' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  AI Extraction Complete
                </>
              ) : stage === 'error' ? (
                <>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Processing Issue
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  AI Processing Documents
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {stage === 'complete'
                ? 'Your documents have been analyzed and answers have been pre-filled.'
                : stage === 'error'
                  ? 'There was an issue processing your documents.'
                  : 'Please wait while we analyze your documents and extract relevant answers.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Animated Processing Stage */}
            {stage !== 'complete' && stage !== 'error' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <StageIcon
                      className={cn(
                        'h-10 w-10 text-emerald-600',
                        isProcessing && 'animate-pulse'
                      )}
                    />
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  )}
                </div>
                <p className="mt-4 text-sm font-medium text-gray-700">
                  {STAGE_MESSAGES[stage]}
                </p>
              </div>
            )}

            {/* Progress Bar */}
            {stage !== 'complete' && stage !== 'error' && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  {progress < 30
                    ? 'Preparing documents...'
                    : progress < 60
                      ? 'AI is reading your documents...'
                      : progress < 90
                        ? 'Matching answers to questions...'
                        : 'Finalizing...'}
                </p>
              </div>
            )}

            {/* Results */}
            {stage === 'complete' && result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{result.processed}</p>
                    <p className="text-sm text-gray-500">Documents Processed</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{result.extracted}</p>
                    <p className="text-sm text-gray-500">Answers Extracted</p>
                  </div>
                </div>

                {result.extracted > 0 && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {result.extracted} answers pre-filled!
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Review each AI suggestion and confirm or edit as needed.
                          AI-filled answers are highlighted in green.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {result.extracted === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                      No answers could be automatically extracted. You can fill out the
                      questionnaire manually.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {stage === 'error' && result?.errors && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">{result.errors[0]}</p>
              </div>
            )}

            {/* Continue Button */}
            {(stage === 'complete' || stage === 'error') && (
              <Button onClick={handleContinue} className="w-full">
                Continue to Questions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
