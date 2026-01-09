/**
 * Testing Dashboard Page
 *
 * Resilience testing management for DORA Chapter IV compliance
 * Articles 24-27 - Digital Operational Resilience Testing
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  FlaskConical,
  Bug,
  Scale,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTestingStats, getTests, getTLPTEngagements, getOpenFindingsSummary } from '@/lib/testing/queries';
import { getOrganizationContext } from '@/lib/org/context';
import {
  getTestTypeLabel,
  getTestStatusColor,
  getFindingSeverityColor,
  getTLPTFrameworkLabel,
  TEST_TYPES,
} from '@/lib/testing/types';

export const metadata = {
  title: 'Resilience Testing | DORA Comply',
  description: 'Digital operational resilience testing management',
};

// Stats Cards Component
async function TestingStatsCards({ tlptRequired }: { tlptRequired: boolean }) {
  const { data: stats } = await getTestingStats();

  if (!stats) {
    return null;
  }

  // Build stat cards based on entity classification
  const statCards = [
    {
      title: 'Active Programmes',
      value: stats.active_programmes,
      icon: Calendar,
      description: `${stats.total_programmes} total programmes`,
    },
    {
      title: 'Tests Completed',
      value: stats.completed_tests_this_year,
      icon: CheckCircle2,
      description: 'This year',
    },
    {
      title: 'Open Findings',
      value: stats.open_findings,
      icon: Bug,
      description: `${stats.critical_open_findings} critical`,
      variant: stats.critical_open_findings > 0 ? 'destructive' : 'default',
    },
    // Show TLPT status differently based on whether it's required
    tlptRequired
      ? {
          title: 'TLPT Status',
          value: stats.tlpt_overdue > 0 ? 'Action Needed' : 'On Track',
          icon: Target,
          description: `${stats.tlpt_due_soon} due soon`,
          variant: stats.tlpt_overdue > 0 ? 'destructive' : 'default',
          textValue: true,
        }
      : {
          title: 'TLPT',
          value: 'N/A',
          icon: Target,
          description: 'Not required for your entity',
          variant: 'default',
          textValue: true,
        },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.variant === 'destructive' ? 'text-destructive' : ''}`}>
              {stat.textValue ? stat.value : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Test Type Coverage Component
async function TestTypeCoverageCard() {
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

// Open Findings Summary Component
async function OpenFindingsCard() {
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

// Recent Tests Component
async function RecentTestsCard() {
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

// TLPT Status Component
async function TLPTStatusCard() {
  const { data: engagements } = await getTLPTEngagements();

  if (!engagements || engagements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            TLPT Engagements
          </CardTitle>
          <CardDescription>Threat-Led Penetration Testing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No TLPT engagements yet. Significant entities must conduct TLPT every 3 years.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/testing/tlpt/new">
              <Plus className="mr-2 h-4 w-4" />
              Plan TLPT
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
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              TLPT Engagements
            </CardTitle>
            <CardDescription>Article 26 - Advanced testing</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/testing/tlpt">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {engagements.slice(0, 3).map((tlpt) => (
          <Link
            key={tlpt.id}
            href={`/testing/tlpt/${tlpt.id}`}
            className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{tlpt.name}</p>
              <p className="text-xs text-muted-foreground">
                {tlpt.tlpt_ref} · {getTLPTFrameworkLabel(tlpt.framework)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge
                variant={
                  tlpt.compliance_status === 'overdue'
                    ? 'destructive'
                    : tlpt.compliance_status === 'due_soon'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {tlpt.compliance_status === 'overdue'
                  ? 'Overdue'
                  : tlpt.compliance_status === 'due_soon'
                  ? `Due in ${tlpt.days_until_due}d`
                  : tlpt.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Non-Significant Entity Info Card
function NonSignificantTLPTInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          TLPT Not Required
        </CardTitle>
        <CardDescription>Based on your entity classification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-info/50 bg-info/5">
          <Scale className="h-4 w-4 text-info" />
          <AlertTitle className="text-info">Non-Significant Entity</AlertTitle>
          <AlertDescription className="text-sm">
            Threat-Led Penetration Testing (TLPT) under DORA Article 26-27 is mandatory only
            for significant financial entities. Your organization is classified as non-significant.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          While TLPT is not required, you may still conduct voluntary advanced penetration testing
          as part of your resilience testing programme.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/organization">
              Review Classification
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/testing/tlpt/new">
              Plan Voluntary TLPT
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TestingPage() {
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
            Your organization qualifies for proportionate testing requirements. Focus on basic
            resilience testing per your risk profile.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <TestingStatsCards tlptRequired={tlptRequired} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Main Column */}
        <div className="space-y-6">
          <Suspense fallback={<ListSkeleton />}>
            <RecentTestsCard />
          </Suspense>

          {/* TLPT Section - only for significant entities, or show info for non-significant */}
          {tlptRequired ? (
            <Suspense fallback={<ListSkeleton />}>
              <TLPTStatusCard />
            </Suspense>
          ) : (
            <NonSignificantTLPTInfo />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TestTypeCoverageCard />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-48" />}>
            <OpenFindingsCard />
          </Suspense>

          {/* Quick Reference Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DORA Testing Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Article 24</span>
                <Badge variant="outline">Annual Programme</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Article 25</span>
                <Badge variant="outline">10 Test Types</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Article 26</span>
                <Badge variant={tlptRequired ? 'default' : 'secondary'}>
                  TLPT{tlptRequired ? ' Required' : ' (Significant only)'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Article 27</span>
                <Badge variant="outline">Tester Requirements</Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {tlptRequired
                  ? 'As a significant entity, you must conduct TLPT every 3 years.'
                  : 'Financial entities must establish testing programmes based on risk.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
