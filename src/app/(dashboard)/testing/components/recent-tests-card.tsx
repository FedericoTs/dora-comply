/**
 * Recent Tests Card Component
 *
 * Displays the most recent resilience tests
 */

import Link from 'next/link';
import { Plus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTests } from '@/lib/testing/queries';
import { getTestTypeLabel } from '@/lib/testing/types';

export async function RecentTestsCard() {
  const { data: tests } = await getTests();

  if (!tests || tests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Tests Yet</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Start your resilience testing programme by creating your first test.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href="/testing/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create First Test
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Tests</CardTitle>
            <CardDescription>Latest resilience tests</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/testing/tests">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.slice(0, 5).map((test) => (
            <Link
              key={test.id}
              href={`/testing/tests/${test.id}`}
              className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{test.name}</p>
                <p className="text-xs text-muted-foreground">
                  {test.test_ref} · {getTestTypeLabel(test.test_type)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {test.critical_findings_count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {test.critical_findings_count} critical
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">
                  {test.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
