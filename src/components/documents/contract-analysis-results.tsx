'use client';

/**
 * Contract Analysis Results
 *
 * Displays AI-extracted DORA provisions from a contract
 * Includes formal sign-off workflow for regulatory compliance
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  FileText,
  Calendar,
  Euro,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  PenLine,
  User,
  Clock,
} from 'lucide-react';
import type {
  ParsedContractRecord,
  ExtractedProvision,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
  RiskFlag,
  ComplianceGap,
} from '@/lib/ai/types';
import { DORA_PROVISION_LABELS } from '@/lib/contracts/types';
import { AnalysisSignOffDialog } from './analysis-sign-off-dialog';

interface ContractAnalysisResultsProps {
  analysis: ParsedContractRecord;
  showHeader?: boolean;
  onSignOffComplete?: () => void;
  onApplyToContract?: (analysisId: string) => void;
  contractId?: string;
}

const STATUS_CONFIG = {
  present: {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Present',
  },
  partial: {
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Partial',
  },
  missing: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Missing',
  },
  unclear: {
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Unclear',
  },
  not_analyzed: {
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Not Analyzed',
  },
};

function ProvisionCard({
  provisionKey,
  provision,
}: {
  provisionKey: string;
  provision: ExtractedProvision;
}) {
  const config = STATUS_CONFIG[provision.status] || STATUS_CONFIG.not_analyzed;
  const Icon = config.icon;
  const labelInfo = DORA_PROVISION_LABELS[provisionKey];

  return (
    <AccordionItem value={provisionKey} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`rounded-full p-1.5 ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{labelInfo?.label || provisionKey}</span>
              <Badge variant="outline" className="text-xs">
                {labelInfo?.article || 'Art. 30'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {labelInfo?.description}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${config.bgColor} ${config.color} border-0`}>
                  {Math.round(provision.confidence * 100)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI confidence: {Math.round(provision.confidence * 100)}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        <div className="space-y-3">
          {provision.location && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>{provision.location}</span>
            </div>
          )}

          {provision.analysis && (
            <div className="text-sm">
              <p className="font-medium mb-1">Analysis</p>
              <p className="text-muted-foreground">{provision.analysis}</p>
            </div>
          )}

          {provision.excerpts && provision.excerpts.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2">Relevant Excerpts</p>
              <div className="space-y-2">
                {provision.excerpts.map((excerpt, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-primary/50 pl-3 py-1 text-muted-foreground italic text-xs"
                  >
                    &ldquo;{excerpt}&rdquo;
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {provision.gaps && provision.gaps.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2 text-warning">Identified Gaps</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                {provision.gaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ProvisionsList({
  provisions,
  article,
}: {
  provisions: ExtractedArticle30_2 | ExtractedArticle30_3;
  article: '30.2' | '30.3';
}) {
  const entries = Object.entries(provisions) as [string, ExtractedProvision][];

  // Count statuses
  const statusCounts = entries.reduce(
    (acc, [, p]) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Summary:</span>
        {statusCounts.present > 0 && (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-4 w-4" />
            {statusCounts.present} present
          </span>
        )}
        {statusCounts.partial > 0 && (
          <span className="flex items-center gap-1 text-warning">
            <AlertCircle className="h-4 w-4" />
            {statusCounts.partial} partial
          </span>
        )}
        {statusCounts.missing > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" />
            {statusCounts.missing} missing
          </span>
        )}
      </div>

      <Accordion type="multiple" className="space-y-0">
        {entries.map(([key, provision]) => (
          <ProvisionCard key={key} provisionKey={key} provision={provision} />
        ))}
      </Accordion>
    </div>
  );
}

function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  const severityColors = {
    low: 'border-muted bg-muted/50',
    medium: 'border-warning/50 bg-warning/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    critical: 'border-destructive/50 bg-destructive/10',
  };

  return (
    <div className={`rounded-lg border p-4 ${severityColors[flag.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 ${
              flag.severity === 'critical'
                ? 'text-destructive'
                : flag.severity === 'high'
                ? 'text-orange-500'
                : flag.severity === 'medium'
                ? 'text-warning'
                : 'text-muted-foreground'
            }`}
          />
          <div>
            <p className="font-medium">{flag.category}</p>
            <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
            <p className="text-sm mt-2">
              <span className="font-medium">Recommendation:</span> {flag.recommendation}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {flag.severity}
        </Badge>
      </div>
    </div>
  );
}

function ComplianceGapCard({ gap }: { gap: ComplianceGap }) {
  const priorityColors = {
    low: 'border-muted',
    medium: 'border-warning/50',
    high: 'border-destructive/50',
  };

  return (
    <div className={`rounded-lg border p-4 ${priorityColors[gap.priority]}`}>
      <div className="flex items-start gap-3">
        <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{gap.provision}</span>
            <Badge variant="outline" className="text-xs">
              {gap.article}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs capitalize ${
                gap.priority === 'high'
                  ? 'border-destructive text-destructive'
                  : gap.priority === 'medium'
                  ? 'border-warning text-warning'
                  : ''
              }`}
            >
              {gap.priority} priority
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{gap.description}</p>
          <p className="text-sm mt-2">
            <span className="font-medium">Remediation:</span> {gap.remediation}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContractAnalysisResults({
  analysis,
  showHeader = true,
  onSignOffComplete,
  onApplyToContract,
  contractId,
}: ContractAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('article-30-2');
  const [showSignOffDialog, setShowSignOffDialog] = useState(false);

  const article30_2 = analysis.article_30_2 as ExtractedArticle30_2;
  const article30_3 = analysis.article_30_3 as ExtractedArticle30_3;
  const riskFlags = (analysis.risk_flags || []) as RiskFlag[];
  const complianceGaps = (analysis.compliance_gaps || []) as ComplianceGap[];

  const isSignedOff = analysis.review_confirmed === true;

  const handleSignOffComplete = () => {
    onSignOffComplete?.();
    setShowSignOffDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Sign-off Status Banner */}
      {!isSignedOff ? (
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
                onClick={() => setShowSignOffDialog(true)}
                className="shrink-0 gap-2"
              >
                <PenLine className="h-4 w-4" />
                Review & Sign Off
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
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
      )}

      {showHeader && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">DORA Compliance Analysis</CardTitle>
              <div className="flex items-center gap-2">
                {isSignedOff && (
                  <Badge variant="outline" className="border-success text-success text-xs gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Signed Off
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Analyzed {new Date(analysis.extracted_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p
                  className={`text-2xl font-bold ${
                    (analysis.overall_compliance_score || 0) >= 80
                      ? 'text-success'
                      : (analysis.overall_compliance_score || 0) >= 50
                      ? 'text-warning'
                      : 'text-destructive'
                  }`}
                >
                  {analysis.overall_compliance_score || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Score</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{analysis.article_30_2_score || 0}%</p>
                <p className="text-xs text-muted-foreground">Art. 30.2 Score</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{analysis.article_30_3_score || 0}%</p>
                <p className="text-xs text-muted-foreground">Art. 30.3 Score</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {Math.round((analysis.confidence_score || 0) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">AI Confidence</p>
              </div>
            </div>

            {/* Contract Info */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {analysis.identified_contract_type && (
                <div>
                  <p className="text-muted-foreground">Contract Type</p>
                  <p className="font-medium capitalize">
                    {analysis.identified_contract_type.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {analysis.identified_effective_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Effective</p>
                    <p className="font-medium">{analysis.identified_effective_date}</p>
                  </div>
                </div>
              )}
              {analysis.identified_expiry_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Expiry</p>
                    <p className="font-medium">{analysis.identified_expiry_date}</p>
                  </div>
                </div>
              )}
              {analysis.identified_governing_law && (
                <div>
                  <p className="text-muted-foreground">Governing Law</p>
                  <p className="font-medium">{analysis.identified_governing_law}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign-off Dialog */}
      <AnalysisSignOffDialog
        open={showSignOffDialog}
        onOpenChange={setShowSignOffDialog}
        analysis={analysis}
        onSignOffComplete={handleSignOffComplete}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="article-30-2">Art. 30.2</TabsTrigger>
          <TabsTrigger value="article-30-3">Art. 30.3</TabsTrigger>
          <TabsTrigger value="risks">
            Risks
            {riskFlags.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0">
                {riskFlags.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gaps">
            Gaps
            {complianceGaps.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0">
                {complianceGaps.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="article-30-2" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Article 30.2 - Basic Provisions (All ICT Contracts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProvisionsList provisions={article30_2} article="30.2" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="article-30-3" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Article 30.3 - Critical Function Provisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProvisionsList provisions={article30_3} article="30.3" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {riskFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>No significant risk flags identified</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskFlags.map((flag, i) => (
                    <RiskFlagCard key={i} flag={flag} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceGaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>No compliance gaps identified</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceGaps.map((gap, i) => (
                    <ComplianceGapCard key={i} gap={gap} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
