'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ComplianceStats } from './types';

interface ProgressOverviewCardProps {
  stats: ComplianceStats;
}

export function ProgressOverviewCard({ stats }: ProgressOverviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">DORA Compliance Progress</CardTitle>
            <CardDescription>
              Track and close gaps across all 45 DORA requirements
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.coveragePercentage}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={stats.coveragePercentage} className="h-3 mb-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-success/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-success">{stats.coveredCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Covered</div>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-2xl font-bold text-warning">{stats.partialCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Partial</div>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{stats.gapCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Gaps</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
