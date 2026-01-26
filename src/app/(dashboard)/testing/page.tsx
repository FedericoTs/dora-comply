/**
 * Testing Dashboard Page
 *
 * Unified resilience testing management for DORA Chapter IV compliance
 * Articles 24-27 - Digital Operational Resilience Testing
 *
 * Combines Tests and TLPT views in a tabbed interface.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Target, Scale, FlaskConical, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrganization, getOrganizationContext } from '@/lib/org/context';
import { hasModuleAccess } from '@/lib/licensing/check-access-server';
import { LockedModule } from '@/components/licensing/locked-module';
import { getTests, getTLPTEngagements } from '@/lib/testing/queries';
import {
  getTestTypeLabel,
  getTestStatusLabel,
  getTestResultLabel,
  getTLPTFrameworkLabel,
  getTLPTStatusLabel,
  TEST_TYPES,
} from '@/lib/testing/types';
import {
  TestingStatsCards,
  StatsCardsSkeleton,
  TestTypeCoverageCard,
  OpenFindingsCard,
  DORARequirementsCard,
} from './components';

export const metadata = {
  title: 'Resilience Testing | DORA Comply',
  description: 'Digital operational resilience testing management',
};

// Locked state component
function TestingLockedState() {
  return (
    <LockedModule
      framework="dora"
      moduleName="Resilience Testing"
      features={[
        'DORA Chapter IV test planning & execution',
        'TLPT (Threat-Led Penetration Testing) management',
        '10+ test type coverage tracking',
        'Finding management with CVSS scoring',
        'Tester certification verification',
        'Regulatory reporting for Article 24-27',
      ]}
      upgradeTier="professional"
    />
  );
}

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

// TLPT Table Component
async function TLPTTable() {
  const { data: engagements, count } = await getTLPTEngagements();

  if (!engagements || engagements.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No TLPT Engagements</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Significant financial entities must conduct TLPT at least every 3 years
            per DORA Article 26. Start by planning your first TLPT engagement.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href="/testing/tlpt/new">
              <Plus className="mr-2 h-4 w-4" />
              Plan First TLPT
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
            <CardTitle>TLPT Engagements</CardTitle>
            <CardDescription>{count} engagements total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engagements.map((tlpt) => (
              <TableRow key={tlpt.id}>
                <TableCell className="font-mono text-sm">{tlpt.tlpt_ref}</TableCell>
                <TableCell>
                  <Link
                    href={`/testing/tlpt/${tlpt.id}`}
                    className="font-medium hover:underline"
                  >
                    {tlpt.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getTLPTFrameworkLabel(tlpt.framework)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {getTLPTStatusLabel(tlpt.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tlpt.compliance_status === 'overdue'
                        ? 'destructive'
                        : tlpt.compliance_status === 'due_soon'
                        ? 'secondary'
                        : tlpt.compliance_status === 'compliant'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {tlpt.compliance_status === 'overdue'
                      ? 'Overdue'
                      : tlpt.compliance_status === 'due_soon'
                      ? 'Due Soon'
                      : tlpt.compliance_status === 'compliant'
                      ? 'Compliant'
                      : 'Not Scheduled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tlpt.next_tlpt_due ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(tlpt.next_tlpt_due).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/testing/tlpt/${tlpt.id}`}>View</Link>
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

// TIBER-EU Phases Card
function TIBERPhasesCard() {
  const phases = [
    { name: 'Planning', description: 'Scope definition' },
    { name: 'Threat Intel', description: 'TI provider analysis' },
    { name: 'Red Team', description: 'Active testing' },
    { name: 'Closure', description: 'Purple team & remediation' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TIBER-EU Phases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {phases.map((phase, index) => (
          <div key={phase.name} className="flex items-center gap-2 text-sm">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
              {index + 1}
            </div>
            <span className="font-medium">{phase.name}</span>
            <span className="text-muted-foreground text-xs">- {phase.description}</span>
          </div>
        ))}
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

export default async function TestingPage() {
  // Check license access
  const org = await getOrganization();
  if (!org) {
    return <TestingLockedState />;
  }

  const hasAccess = await hasModuleAccess(org.id, 'dora', 'testing');
  if (!hasAccess) {
    return <TestingLockedState />;
  }

  // Fetch organization context for entity classification
  const orgContext = await getOrganizationContext();
  const tlptRequired = orgContext?.classification?.tlptRequired ?? false;
  const simplifiedFramework = orgContext?.classification?.simplifiedFramework ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resilience Testing</h1>
          <p className="text-muted-foreground">
            Digital operational resilience testing per DORA Chapter IV
          </p>
        </div>
        <div className="flex gap-2">
          {tlptRequired && (
            <Button variant="outline" asChild>
              <Link href="/testing/tlpt/new">
                <Target className="mr-2 h-4 w-4" />
                Plan TLPT
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/testing/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Simplified Framework Banner */}
      {simplifiedFramework && (
        <Alert className="border-success/50 bg-success/10">
          <Scale className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Simplified Framework (Article 16)</AlertTitle>
          <AlertDescription>
            Your organization qualifies for proportionate testing requirements.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <TestingStatsCards tlptRequired={tlptRequired} />
      </Suspense>

      {/* Tabbed Content */}
      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Tests
          </TabsTrigger>
          {tlptRequired && (
            <TabsTrigger value="tlpt" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              TLPT
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tests Tab */}
        <TabsContent value="tests">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Suspense fallback={<TableSkeleton />}>
              <TestsTable />
            </Suspense>
            <div className="space-y-4">
              <Suspense fallback={<Skeleton className="h-64" />}>
                <TestTypeCoverageCard />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-48" />}>
                <OpenFindingsCard />
              </Suspense>
            </div>
          </div>
        </TabsContent>

        {/* TLPT Tab */}
        {tlptRequired && (
          <TabsContent value="tlpt">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <Suspense fallback={<TableSkeleton />}>
                <TLPTTable />
              </Suspense>
              <div className="space-y-4">
                <TIBERPhasesCard />
                <DORARequirementsCard tlptRequired={tlptRequired} />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
