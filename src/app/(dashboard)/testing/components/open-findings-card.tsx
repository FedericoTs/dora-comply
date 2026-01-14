/**
 * Open Findings Card Component
 *
 * Displays summary of open test findings by severity
 */

import Link from 'next/link';
import { Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getOpenFindingsSummary } from '@/lib/testing/queries';

export async function OpenFindingsCard() {
  const { data: findings } = await getOpenFindingsSummary();

  if (!findings || findings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Open Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No open findings</p>
        </CardContent>
      </Card>
    );
  }

  const total = findings.reduce((acc, f) => acc + f.count, 0);
  const overdue = findings.reduce((acc, f) => acc + f.overdue_count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Open Findings
        </CardTitle>
        <CardDescription>
          {total} open, {overdue} overdue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {findings.map((f) => (
          <div key={f.severity} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  f.severity === 'critical'
                    ? 'bg-red-500'
                    : f.severity === 'high'
                    ? 'bg-orange-500'
                    : f.severity === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
              />
              <span className="text-sm capitalize">{f.severity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{f.count}</span>
              {f.overdue_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {f.overdue_count} overdue
                </Badge>
              )}
            </div>
          </div>
        ))}
        <Link
          href="/testing/tests?filter=findings"
          className="text-xs text-primary hover:underline block text-center pt-2"
        >
          View all findings
        </Link>
      </CardContent>
    </Card>
  );
}
