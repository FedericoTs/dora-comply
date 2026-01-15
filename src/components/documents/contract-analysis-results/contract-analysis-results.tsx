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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2 } from 'lucide-react';
import { AnalysisSignOffDialog } from '../analysis-sign-off-dialog';
import { SignOffBanner } from './sign-off-banner';
import { ScoreHeader } from './score-header';
import { ProvisionsList } from './provisions-list';
import { RiskFlagCard } from './risk-flag-card';
import { ComplianceGapCard } from './compliance-gap-card';
import type {
  ContractAnalysisResultsProps,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
  RiskFlag,
  ComplianceGap,
} from './types';

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
      <SignOffBanner
        analysis={analysis}
        isSignedOff={isSignedOff}
        onSignOff={() => setShowSignOffDialog(true)}
        onApplyToContract={onApplyToContract}
        contractId={contractId}
      />

      {showHeader && <ScoreHeader analysis={analysis} isSignedOff={isSignedOff} />}

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
              <ProvisionsList provisions={article30_2} />
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
              <ProvisionsList provisions={article30_3} />
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
                <EmptyState message="No significant risk flags identified" />
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
                <EmptyState message="No compliance gaps identified" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
      <p>{message}</p>
    </div>
  );
}
