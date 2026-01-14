'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calendar } from 'lucide-react';
import type { ParsedContractRecord } from './types';

interface ScoreHeaderProps {
  analysis: ParsedContractRecord;
  isSignedOff: boolean;
}

export function ScoreHeader({ analysis, isSignedOff }: ScoreHeaderProps) {
  return (
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
        <ScoreGrid analysis={analysis} />
        <ContractInfo analysis={analysis} />
      </CardContent>
    </Card>
  );
}

function ScoreGrid({ analysis }: { analysis: ParsedContractRecord }) {
  const overallScore = analysis.overall_compliance_score || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <p
          className={`text-2xl font-bold ${
            overallScore >= 80
              ? 'text-success'
              : overallScore >= 50
              ? 'text-warning'
              : 'text-destructive'
          }`}
        >
          {overallScore}%
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
  );
}

function ContractInfo({ analysis }: { analysis: ParsedContractRecord }) {
  const hasInfo = analysis.identified_contract_type ||
    analysis.identified_effective_date ||
    analysis.identified_expiry_date ||
    analysis.identified_governing_law;

  if (!hasInfo) return null;

  return (
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
  );
}
