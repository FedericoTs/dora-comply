/**
 * SOC 2 Report Details Card
 *
 * Shows audit firm, period, and system description with confidence score.
 */

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ConfidenceScores } from '@/lib/soc2/soc2-types';

interface Soc2ReportDetailsCardProps {
  auditFirm: string;
  periodStart: string;
  periodEnd: string;
  reportType: 'type1' | 'type2';
  createdAt: string;
  systemDescription?: string;
  confidenceScores?: ConfidenceScores;
}

export function Soc2ReportDetailsCard({
  auditFirm,
  periodStart,
  periodEnd,
  reportType,
  createdAt,
  systemDescription,
  confidenceScores,
}: Soc2ReportDetailsCardProps) {
  const overallConfidence = confidenceScores?.overall || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI Confidence</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Progress value={overallConfidence * 100} className="h-2 w-20" />
                  <span className="text-sm font-medium">
                    {Math.round(overallConfidence * 100)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI extraction confidence score</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Audit Firm</p>
            <p className="mt-1 font-medium">{auditFirm}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Audit Period</p>
            <p className="mt-1">
              {new Date(periodStart).toLocaleDateString()} -{' '}
              {new Date(periodEnd).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Parsed On</p>
            <p className="mt-1">{new Date(createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Report Type</p>
            <p className="mt-1">SOC 2 Type {reportType === 'type2' ? 'II' : 'I'}</p>
          </div>
        </div>
        {systemDescription && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              System Description
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3">{systemDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
