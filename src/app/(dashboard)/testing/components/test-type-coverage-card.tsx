/**
 * Test Type Coverage Card Component
 *
 * Displays coverage percentage across the 10 required test types
 */

import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getTestingStats } from '@/lib/testing/queries';
import { getTestTypeLabel, TEST_TYPES } from '@/lib/testing/types';

export async function TestTypeCoverageCard() {
  const { data: stats } = await getTestingStats();

  if (!stats) return null;

  const coverage = stats.test_type_coverage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Test Type Coverage
        </CardTitle>
        <CardDescription>Article 25.1 - 10 required test types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{coverage}%</span>
          <Badge variant={coverage >= 80 ? 'default' : coverage >= 50 ? 'secondary' : 'destructive'}>
            {coverage >= 80 ? 'Good' : coverage >= 50 ? 'Partial' : 'Low'}
          </Badge>
        </div>
        <Progress value={coverage} className="h-2" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          {TEST_TYPES.slice(0, 6).map((type) => {
            const count = stats.tests_by_type[type] || 0;
            return (
              <div
                key={type}
                className={`text-xs px-2 py-1 rounded ${
                  count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {getTestTypeLabel(type).split(' ')[0]}
                {count > 0 && <span className="ml-1">({count})</span>}
              </div>
            );
          })}
        </div>
        <Link
          href="/testing/tests"
          className="text-xs text-primary hover:underline block text-center pt-2"
        >
          View all test types
        </Link>
      </CardContent>
    </Card>
  );
}
