/**
 * Test Detail Page
 *
 * View and manage individual resilience tests with findings
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FlaskConical,
  Calendar,
  User,
  Building2,
  FileText,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
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
import { getTestById } from '@/lib/testing/queries';
import {
  getTestTypeLabel,
  getTestStatusLabel,
  getTestResultLabel,
  getFindingSeverityLabel,
  getFindingStatusLabel,
  type TestFinding,
  type TestType,
} from '@/lib/testing/types';

interface TestDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TestDetailPageProps) {
  const { id } = await params;
  const { data: test } = await getTestById(id);

  return {
    title: test ? `${test.name} | Resilience Testing` : 'Test Not Found',
    description: test?.description || 'View test details and findings',
  };
}

// Test Info Card
function TestInfoCard({ test }: { test: NonNullable<Awaited<ReturnType<typeof getTestById>>['data']> }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {test.name}
            </CardTitle>
            <CardDescription className="font-mono">{test.test_ref}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getTestTypeLabel(test.test_type)}</Badge>
            <Badge
              variant={
                test.status === 'completed'
                  ? 'default'
                  : test.status === 'in_progress'
                  ? 'secondary'
                  : test.status === 'remediation_required'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {getTestStatusLabel(test.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {test.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{test.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Result</p>
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
              <span className="text-sm text-muted-foreground">Not assessed</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Planned Start</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {test.planned_start_date
                ? new Date(test.planned_start_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Actual End</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {test.actual_end_date
                ? new Date(test.actual_end_date).toLocaleDateString()
                : 'Not completed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Bug className="h-3.5 w-3.5" />
              {test.findings_count}
              {test.critical_findings_count > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {test.critical_findings_count} critical
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Related entities */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Programme</p>
            {test.programme ? (
              <Link
                href={`/testing/programmes/${test.programme.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                {test.programme.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No programme</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vendor</p>
            {test.vendor ? (
              <Link
                href={`/vendors/${test.vendor.id}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {test.vendor.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No vendor</span>
            )}
          </div>
        </div>

        {/* Tester information */}
        {(test.tester_name || test.tester_organization || test.tester_certifications?.length) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <User className="h-4 w-4" />
              Tester Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {test.tester_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tester Name</p>
                  <p className="text-sm">{test.tester_name}</p>
                </div>
              )}
              {test.tester_organization && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company</p>
                  <p className="text-sm">{test.tester_organization}</p>
                </div>
              )}
              {test.tester_certifications && test.tester_certifications.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Certifications (Article 27)</p>
                  <div className="flex flex-wrap gap-1">
                    {test.tester_certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scope */}
        {test.scope_description && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Test Scope</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.scope_description}</p>
          </div>
        )}

        {/* Methodology */}
        {test.methodology && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Methodology</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.methodology}</p>
          </div>
        )}

        {/* Executive Summary */}
        {test.executive_summary && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-1">Executive Summary</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.executive_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Findings Table
function FindingsTable({ findings, testId }: { findings: TestFinding[]; testId: string }) {
  if (findings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bug className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Findings</CardTitle>
          <CardDescription>
            No issues were found during this test, or findings haven&apos;t been recorded yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href={`/testing/tests/${testId}/findings/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Finding
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group findings by severity for summary
  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Findings
            </CardTitle>
            <CardDescription>
              {findings.length} finding{findings.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href={`/testing/tests/${testId}/findings/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Finding
            </Link>
          </Button>
        </div>
        {/* Severity summary */}
        <div className="flex gap-2 pt-2">
          {severityCounts.critical && (
            <Badge variant="destructive">{severityCounts.critical} Critical</Badge>
          )}
          {severityCounts.high && (
            <Badge className="bg-orange-500">{severityCounts.high} High</Badge>
          )}
          {severityCounts.medium && (
            <Badge className="bg-yellow-500 text-black">{severityCounts.medium} Medium</Badge>
          )}
          {severityCounts.low && (
            <Badge variant="secondary">{severityCounts.low} Low</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => {
              const isOverdue =
                finding.status !== 'remediated' &&
                finding.status !== 'risk_accepted' &&
                finding.remediation_deadline &&
                new Date(finding.remediation_deadline) < new Date();

              return (
                <TableRow key={finding.id}>
                  <TableCell className="font-mono text-sm">{finding.finding_ref}</TableCell>
                  <TableCell>
                    <span className="font-medium">{finding.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        finding.severity === 'critical'
                          ? 'destructive'
                          : finding.severity === 'high'
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        finding.severity === 'high'
                          ? 'bg-orange-500'
                          : finding.severity === 'medium'
                          ? 'bg-yellow-500 text-black'
                          : ''
                      }
                    >
                      {getFindingSeverityLabel(finding.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        finding.status === 'remediated'
                          ? 'default'
                          : finding.status === 'in_remediation'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {getFindingStatusLabel(finding.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {finding.remediation_deadline ? (
                      <div className="flex items-center gap-1">
                        <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-destructive' : ''}`} />
                        <span className={isOverdue ? 'text-destructive' : ''}>
                          {new Date(finding.remediation_deadline).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs ml-1">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/testing/tests/${testId}/findings/${finding.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Article 25 Requirements Card
function Article25Card({ testType }: { testType: TestType }) {
  const requirements: Record<string, string> = {
    vulnerability_assessment: 'Identify security vulnerabilities in systems and networks',
    penetration_test: 'Test defenses using simulated attacks',
    scenario_based_test: 'Test response to specific threat scenarios',
    compatibility_test: 'Verify system compatibility and interoperability',
    performance_test: 'Assess system performance under load',
    end_to_end_test: 'Test complete business processes',
    source_code_review: 'Analyze code for security flaws',
    network_security_assessment: 'Evaluate network security controls',
    gap_analysis: 'Identify gaps against requirements/standards',
    physical_security_review: 'Review physical security measures',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 25 Requirement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{getTestTypeLabel(testType)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {requirements[testType] || 'Digital operational resilience testing requirement'}
        </p>
        <p className="text-xs text-muted-foreground border-t pt-3">
          Financial entities must test ICT systems, risk management, and business continuity
          using appropriate testing approaches based on their risk profile.
        </p>
      </CardContent>
    </Card>
  );
}

// Quick Stats Card
function QuickStatsCard({
  test,
}: {
  test: NonNullable<Awaited<ReturnType<typeof getTestById>>['data']>;
}) {
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

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

async function TestDetailContent({ id }: { id: string }) {
  const { data: test, error } = await getTestById(id);

  if (error || !test) {
    notFound();
  }

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
            <Link href="/testing/tests" className="hover:underline">
              Tests
            </Link>
            <span>/</span>
            <span>{test.test_ref}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{test.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/testing/tests/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <TestInfoCard test={test} />
          <FindingsTable findings={test.findings || []} testId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <QuickStatsCard test={test} />
          <Article25Card testType={test.test_type} />
        </div>
      </div>
    </div>
  );
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestDetailContent id={id} />
    </Suspense>
  );
}
