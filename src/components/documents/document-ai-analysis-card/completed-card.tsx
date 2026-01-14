'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { ContractAnalysisResults } from '../contract-analysis-results';
import { AnalysisSignOffDialog } from '../analysis-sign-off-dialog';
import { PopulateRoiButton } from '../populate-roi-button';
import { ApplyContractDialog } from './apply-contract-dialog';
import type { ParsedContractRecord, Contract } from './types';

interface CompletedCardProps {
  documentId: string;
  vendorId?: string | null;
  vendorName?: string | null;
  analysis: ParsedContractRecord;
  vendorContracts: Contract[];
  isSignedOff: boolean;
  isPending: boolean;
  // Dialog states
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  showSignOff: boolean;
  setShowSignOff: (show: boolean) => void;
  showApplyDialog: boolean;
  setShowApplyDialog: (show: boolean) => void;
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  // Handlers
  onSignOffComplete: () => void;
  onApplyToContract: () => void;
}

export function CompletedCard({
  documentId,
  vendorId,
  vendorName,
  analysis,
  vendorContracts,
  isSignedOff,
  isPending,
  showResults,
  setShowResults,
  showSignOff,
  setShowSignOff,
  showApplyDialog,
  setShowApplyDialog,
  selectedContractId,
  setSelectedContractId,
  onSignOffComplete,
  onApplyToContract,
}: CompletedCardProps) {
  const router = useRouter();

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
          <ScoreSummary
            complianceScore={complianceScore}
            riskCount={riskCount}
            gapCount={gapCount}
          />

          {/* Quick Info */}
          <QuickInfo analysis={analysis} />

          {/* Action Buttons */}
          <ActionButtons
            isSignedOff={isSignedOff}
            vendorContracts={vendorContracts}
            vendorId={vendorId}
            documentId={documentId}
            vendorName={vendorName}
            onViewResults={() => setShowResults(true)}
            onSignOff={() => setShowSignOff(true)}
            onApply={() => setShowApplyDialog(true)}
          />

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
            onSignOffComplete={onSignOffComplete}
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
        onSignOffComplete={onSignOffComplete}
      />

      {/* Apply to Contract Dialog */}
      <ApplyContractDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        contracts={vendorContracts}
        selectedContractId={selectedContractId}
        onContractSelect={setSelectedContractId}
        onApply={onApplyToContract}
        isPending={isPending}
      />
    </>
  );
}

interface ScoreSummaryProps {
  complianceScore: number;
  riskCount: number;
  gapCount: number;
}

function ScoreSummary({ complianceScore, riskCount, gapCount }: ScoreSummaryProps) {
  return (
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
  );
}

function QuickInfo({ analysis }: { analysis: ParsedContractRecord }) {
  return (
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
  );
}

interface ActionButtonsProps {
  isSignedOff: boolean;
  vendorContracts: Contract[];
  vendorId?: string | null;
  documentId: string;
  vendorName?: string | null;
  onViewResults: () => void;
  onSignOff: () => void;
  onApply: () => void;
}

function ActionButtons({
  isSignedOff,
  vendorContracts,
  vendorId,
  documentId,
  vendorName,
  onViewResults,
  onSignOff,
  onApply,
}: ActionButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" className="w-full gap-2" onClick={onViewResults}>
        <Eye className="h-4 w-4" />
        View Full Analysis
      </Button>

      {!isSignedOff ? (
        <Button className="w-full gap-2" onClick={onSignOff}>
          <ShieldCheck className="h-4 w-4" />
          Review &amp; Sign Off
        </Button>
      ) : vendorContracts.length > 0 ? (
        <Button className="w-full gap-2" onClick={onApply}>
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

      {/* 10X Feature: Direct RoI population from AI analysis */}
      <PopulateRoiButton
        documentId={documentId}
        hasAnalysis={true}
        vendorId={vendorId || undefined}
        vendorName={vendorName || undefined}
      />
    </div>
  );
}
