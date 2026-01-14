'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ShieldCheck,
  ShieldAlert,
  PenLine,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { ParsedContractRecord } from './types';

interface SignOffBannerProps {
  analysis: ParsedContractRecord;
  isSignedOff: boolean;
  onSignOff: () => void;
  onApplyToContract?: (analysisId: string) => void;
  contractId?: string;
}

export function SignOffBanner({
  analysis,
  isSignedOff,
  onSignOff,
  onApplyToContract,
  contractId,
}: SignOffBannerProps) {
  if (!isSignedOff) {
    return (
      <Alert variant="destructive" className="border-warning bg-warning/5">
        <ShieldAlert className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Review Required</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm">
              This AI analysis requires formal review and sign-off before it can be applied to a contract.
              You must confirm you have reviewed all provisions, risks, and gaps.
            </p>
            <Button
              size="sm"
              onClick={onSignOff}
              className="shrink-0 gap-2"
            >
              <PenLine className="h-4 w-4" />
              Review & Sign Off
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-success bg-success/5">
      <ShieldCheck className="h-4 w-4 text-success" />
      <AlertTitle className="text-success flex items-center gap-2">
        Formally Reviewed & Signed Off
        <Badge variant="outline" className="border-success text-success text-xs">
          Verified
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Reviewed by: <strong>{analysis.reviewer_name}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Signed off: {analysis.reviewed_at ? new Date(analysis.reviewed_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            {analysis.review_notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Notes: {analysis.review_notes}
              </p>
            )}
          </div>
          {onApplyToContract && contractId && (
            <Button
              size="sm"
              onClick={() => onApplyToContract(analysis.id)}
              className="shrink-0 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply to Contract
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
