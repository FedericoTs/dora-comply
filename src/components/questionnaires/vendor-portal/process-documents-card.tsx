'use client';

/**
 * ProcessDocumentsCard Component
 *
 * Shows on questions page when there are unprocessed documents.
 * Allows users to trigger AI extraction to pre-fill answers.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessDocumentsCardProps {
  token: string;
  unprocessedCount: number;
  totalDocuments: number;
}

export function ProcessDocumentsCard({
  token,
  unprocessedCount,
  totalDocuments: _totalDocuments, // Available for UI display
}: ProcessDocumentsCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed?: number;
    extracted?: number;
    errors?: string[];
  } | null>(null);

  // Don't show if all documents are processed
  if (unprocessedCount === 0 && !result) {
    return null;
  }

  async function handleProcess() {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/vendor-portal/${token}/process`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          errors: [data.error || 'Processing failed'],
        });
        return;
      }

      setResult({
        success: true,
        processed: data.processed || 0,
        extracted: data.extracted || 0,
        errors: data.errors,
      });

      // Refresh the page to show new answers
      if (data.extracted > 0) {
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch {
      setResult({
        success: false,
        errors: ['Network error. Please try again.'],
      });
    } finally {
      setIsProcessing(false);
    }
  }

  // Show success state
  if (result?.success && result.extracted && result.extracted > 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {result.extracted} answers pre-filled!
              </p>
              <p className="text-sm text-gray-600">
                AI has extracted answers from your documents. Review the highlighted fields below.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
              <Sparkles className="h-3 w-3" />
              AI Assisted
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (result?.success === false) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Processing Issue</p>
              <p className="text-sm text-gray-600">
                {result.errors?.[0] || 'Could not process documents. You can fill out the form manually.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleProcess} disabled={isProcessing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isProcessing && 'animate-spin')} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show "no extractions" state
  if (result?.success && result.extracted === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Documents Processed</p>
              <p className="text-sm text-gray-600">
                No answers could be automatically extracted. Please fill out the questionnaire manually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show prompt to process
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {unprocessedCount} document{unprocessedCount > 1 ? 's' : ''} ready for AI analysis
            </p>
            <p className="text-sm text-gray-600">
              Let our AI extract answers from your uploaded documents to save time.
            </p>
          </div>
          <Button onClick={handleProcess} disabled={isProcessing} className="gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Process Documents
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
