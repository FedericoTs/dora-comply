'use client';

/**
 * AI Analysis Sign-off Dialog
 *
 * Formal confirmation dialog requiring users to review and accept responsibility
 * for AI-generated contract analysis results before they can be applied.
 */

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  FileCheck,
  Loader2,
  Scale,
} from 'lucide-react';
import { signOffAnalysis } from '@/lib/ai/actions';
import { toast } from 'sonner';
import type { ParsedContractRecord } from '@/lib/ai/types';

interface AnalysisSignOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ParsedContractRecord;
  onSignOffComplete: () => void;
}

export function AnalysisSignOffDialog({
  open,
  onOpenChange,
  analysis,
  onSignOffComplete,
}: AnalysisSignOffDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [reviewerName, setReviewerName] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [confirmations, setConfirmations] = useState({
    reviewedProvisions: false,
    reviewedRisks: false,
    reviewedGaps: false,
    understandsLimitations: false,
  });

  const allConfirmed =
    confirmations.reviewedProvisions &&
    confirmations.reviewedRisks &&
    confirmations.reviewedGaps &&
    confirmations.understandsLimitations &&
    reviewerName.trim().length >= 2;

  const handleSubmit = () => {
    if (!allConfirmed) return;

    startTransition(async () => {
      const result = await signOffAnalysis({
        analysisId: analysis.id,
        reviewerName: reviewerName.trim(),
        reviewNotes: reviewNotes.trim() || undefined,
        confirmations,
      });

      if (result.success) {
        toast.success('Analysis signed off successfully', {
          description: `Signed off by ${reviewerName} at ${new Date(result.data!.reviewedAt).toLocaleString()}`,
        });
        onSignOffComplete();
        onOpenChange(false);
      } else {
        toast.error('Sign-off failed', {
          description: result.error?.message || 'An error occurred',
        });
      }
    });
  };

  const resetForm = () => {
    setReviewerName('');
    setReviewNotes('');
    setConfirmations({
      reviewedProvisions: false,
      reviewedRisks: false,
      reviewedGaps: false,
      understandsLimitations: false,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Formal AI Analysis Review & Sign-off</DialogTitle>
              <DialogDescription>
                Legal confirmation required before applying AI analysis results
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Legal Disclaimer */}
          <Alert variant="destructive" className="border-warning bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Important Legal Notice</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground mt-2 space-y-2">
              <p>
                This AI-powered analysis is provided as a <strong>preliminary assessment tool only</strong>.
                It is not a substitute for professional legal review and does not constitute legal advice.
              </p>
              <p>
                By signing off on this analysis, you confirm that you have:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Thoroughly reviewed all extracted provisions and findings</li>
                <li>Verified the accuracy of the AI-generated interpretations</li>
                <li>Consulted with legal counsel where appropriate</li>
                <li>Accepted full responsibility for any decisions based on this analysis</li>
              </ul>
              <p className="font-medium text-foreground mt-3">
                The AI may make errors or miss important contractual nuances.
                You bear sole responsibility for the accuracy and completeness of compliance assessments.
              </p>
            </AlertDescription>
          </Alert>

          {/* Analysis Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Analysis Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Contract Type:</span>{' '}
                <span className="font-medium">
                  {analysis.identified_contract_type || 'Not identified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Compliance Score:</span>{' '}
                <span className="font-medium">
                  {analysis.overall_compliance_score ?? 0}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk Flags:</span>{' '}
                <span className="font-medium text-warning">
                  {analysis.risk_flags?.length || 0} identified
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Compliance Gaps:</span>{' '}
                <span className="font-medium text-error">
                  {analysis.compliance_gaps?.length || 0} found
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">AI Confidence:</span>{' '}
                <span className="font-medium">
                  {analysis.confidence_score ?? 0}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>{' '}
                <span className="font-medium text-xs">
                  {analysis.extraction_model}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Required Confirmations
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reviewedProvisions"
                  checked={confirmations.reviewedProvisions}
                  onCheckedChange={(checked) =>
                    setConfirmations((c) => ({
                      ...c,
                      reviewedProvisions: !!checked,
                    }))
                  }
                />
                <Label
                  htmlFor="reviewedProvisions"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I have carefully reviewed all DORA Article 30 provisions extracted by the AI,
                  including their locations and assessments, and I take responsibility for their accuracy.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="reviewedRisks"
                  checked={confirmations.reviewedRisks}
                  onCheckedChange={(checked) =>
                    setConfirmations((c) => ({
                      ...c,
                      reviewedRisks: !!checked,
                    }))
                  }
                />
                <Label
                  htmlFor="reviewedRisks"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I have reviewed all identified risk flags and understand their potential impact
                  on regulatory compliance and operational resilience.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="reviewedGaps"
                  checked={confirmations.reviewedGaps}
                  onCheckedChange={(checked) =>
                    setConfirmations((c) => ({
                      ...c,
                      reviewedGaps: !!checked,
                    }))
                  }
                />
                <Label
                  htmlFor="reviewedGaps"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I have reviewed all identified compliance gaps and their recommended remediation
                  actions, and I accept responsibility for addressing them appropriately.
                </Label>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t">
                <Checkbox
                  id="understandsLimitations"
                  checked={confirmations.understandsLimitations}
                  onCheckedChange={(checked) =>
                    setConfirmations((c) => ({
                      ...c,
                      understandsLimitations: !!checked,
                    }))
                  }
                />
                <Label
                  htmlFor="understandsLimitations"
                  className="text-sm leading-relaxed cursor-pointer font-medium"
                >
                  I understand that this AI analysis may contain errors or omissions, and I accept
                  full legal and regulatory responsibility for any compliance decisions made based
                  on this analysis. I have sought appropriate professional advice where necessary.
                </Label>
              </div>
            </div>
          </div>

          {/* Reviewer Information */}
          <div className="space-y-4 pt-2 border-t">
            <h4 className="font-medium">Reviewer Information</h4>

            <div className="space-y-2">
              <Label htmlFor="reviewerName">
                Full Name <span className="text-error">*</span>
              </Label>
              <Input
                id="reviewerName"
                placeholder="Enter your full name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded as the person who approved this AI analysis
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                placeholder="Add any notes about your review, concerns, or modifications made..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allConfirmed || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Sign Off & Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
