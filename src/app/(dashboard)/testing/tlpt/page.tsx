/**
 * TLPT Engagements Page
 *
 * Threat-Led Penetration Testing management for DORA Article 26
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Target, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { getTLPTEngagements } from '@/lib/testing/queries';
import {
  getTLPTFrameworkLabel,
  getTLPTStatusLabel,
} from '@/lib/testing/types';

export const metadata = {
  title: 'TLPT | Resilience Testing | DORA Comply',
  description: 'Threat-Led Penetration Testing per DORA Article 26',
};

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
                      {tlpt.days_until_due !== null && (
                        <span
                          className={`text-xs ${
                            tlpt.days_until_due < 0
                              ? 'text-destructive'
                              : tlpt.days_until_due < 180
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          ({tlpt.days_until_due < 0 ? `${Math.abs(tlpt.days_until_due)}d overdue` : `${tlpt.days_until_due}d`})
                        </span>
                      )}
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

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// TIBER-EU Phases Card
function TIBERPhasesCard() {
  const phases = [
    { name: 'Planning', description: 'Scope definition and preparation' },
    { name: 'Threat Intelligence', description: 'TI provider analysis' },
    { name: 'Red Team Test', description: 'Active testing phase' },
    { name: 'Closure', description: 'Purple team and remediation' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TIBER-EU Phases</CardTitle>
        <CardDescription>Standard TLPT methodology</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, index) => (
          <div key={phase.name} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{phase.name}</p>
              <p className="text-xs text-muted-foreground">{phase.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Compliance Requirements Card
function ComplianceRequirementsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 26 Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>TLPT every 3 years for significant entities</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Use recognized frameworks (TIBER-EU)</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Independent TI and RT providers</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Cover critical functions and live systems</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Report to competent authorities</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TLPTPage() {
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
            <span>TLPT</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Threat-Led Penetration Testing
          </h1>
          <p className="text-muted-foreground">
            Advanced testing per DORA Article 26 requirements
          </p>
        </div>
        <Button asChild>
          <Link href="/testing/tlpt/new">
            <Plus className="mr-2 h-4 w-4" />
            Plan TLPT
          </Link>
        </Button>
      </div>

      {/* Alert for overdue/due soon */}
      <Suspense fallback={null}>
        <TLPTComplianceAlert />
      </Suspense>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Suspense fallback={<TableSkeleton />}>
            <TLPTTable />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <TIBERPhasesCard />
          <ComplianceRequirementsCard />
        </div>
      </div>
    </div>
  );
}

// Compliance Alert Component
async function TLPTComplianceAlert() {
  const { data: engagements } = await getTLPTEngagements();

  const overdue = engagements?.filter((e) => e.compliance_status === 'overdue') || [];
  const dueSoon = engagements?.filter((e) => e.compliance_status === 'due_soon') || [];

  if (overdue.length === 0 && dueSoon.length === 0) {
    return null;
  }

  return (
    <Card className={overdue.length > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-orange-500/50 bg-orange-500/5'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? 'text-destructive' : 'text-orange-500'}`} />
          {overdue.length > 0 ? 'TLPT Overdue' : 'TLPT Due Soon'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {overdue.length > 0
            ? `${overdue.length} TLPT engagement(s) are overdue. Schedule testing immediately to maintain compliance.`
            : `${dueSoon.length} TLPT engagement(s) are due within 6 months. Plan your testing now.`}
        </p>
      </CardContent>
    </Card>
  );
}
