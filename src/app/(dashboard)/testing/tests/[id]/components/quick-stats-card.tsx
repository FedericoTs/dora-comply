/**
 * Quick Stats Card Component
 *
 * Displays summary statistics for a test
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuickStatsCardProps } from './types';

export function QuickStatsCard({ test }: QuickStatsCardProps) {
  const openFindings = test.findings?.filter(
    (f) => f.status !== 'remediated' && f.status !== 'risk_accepted'
  ).length || 0;

  const overdueFindings = test.findings?.filter(
    (f) =>
      f.status !== 'remediated' &&
      f.status !== 'risk_accepted' &&
      f.remediation_deadline &&
      new Date(f.remediation_deadline) < new Date()
  ).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Findings</span>
          <span className="font-medium">{test.findings_count}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Open</span>
          <span className="font-medium">{openFindings}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Critical</span>
          <span className="font-medium text-destructive">{test.critical_findings_count}</span>
        </div>
        {overdueFindings > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-destructive">Overdue</span>
            <Badge variant="destructive">{overdueFindings}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
