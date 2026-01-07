/**
 * Tests List Page
 *
 * List and filter resilience tests for DORA Article 25
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, FlaskConical, Filter, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTests } from '@/lib/testing/queries';
import {
  getTestTypeLabel,
  getTestStatusLabel,
  getTestStatusColor,
  getTestResultLabel,
  getTestResultColor,
  TEST_TYPES,
  type TestType,
} from '@/lib/testing/types';

export const metadata = {
  title: 'Tests | Resilience Testing | DORA Comply',
  description: 'Manage resilience tests per DORA Article 25',
};

// Tests Table Component
async function TestsTable() {
  const { data: tests, count } = await getTests();

  if (!tests || tests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FlaskConical className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Tests Created</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Start your resilience testing programme by creating your first test.
            DORA Article 25 requires 10 types of tests to be conducted.
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
            <CardTitle>All Tests</CardTitle>
            <CardDescription>{count} tests total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="font-mono text-sm">{test.test_ref}</TableCell>
                <TableCell>
                  <Link
                    href={`/testing/tests/${test.id}`}
                    className="font-medium hover:underline"
                  >
                    {test.name}
                  </Link>
                  {test.programme_name && (
                    <p className="text-xs text-muted-foreground">{test.programme_name}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getTestTypeLabel(test.test_type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {getTestStatusLabel(test.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {test.overall_result ? (
                    <Badge
                      variant={
                        test.overall_result === 'pass'
                          ? 'default'
                          : test.overall_result === 'fail'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {getTestResultLabel(test.overall_result)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{test.findings_count}</span>
                    {test.critical_findings_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {test.critical_findings_count} crit
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/testing/tests/${test.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Test Types Overview Component
function TestTypesOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 25 Test Types</CardTitle>
        <CardDescription>10 required test categories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {TEST_TYPES.map((type) => (
          <div
            key={type}
            className="flex items-center justify-between text-sm py-1"
          >
            <span className="truncate">{getTestTypeLabel(type)}</span>
            <Badge variant="outline" className="ml-2 shrink-0">
              {type.split('_')[0]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function TestsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <span>Tests</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Resilience Tests</h1>
          <p className="text-muted-foreground">
            Manage tests per DORA Article 25 requirements
          </p>
        </div>
        <Button asChild>
          <Link href="/testing/tests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Test
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Suspense fallback={<TableSkeleton />}>
            <TestsTable />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <TestTypesOverview />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/testing/tests?status=in_progress">
                  <Filter className="mr-2 h-4 w-4" />
                  In Progress
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/testing/tests?status=remediation_required">
                  <Bug className="mr-2 h-4 w-4" />
                  Needs Remediation
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/testing/tests?status=completed">
                  Completed
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
