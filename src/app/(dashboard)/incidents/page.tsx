/**
 * Incidents Page
 *
 * ICT incident reporting and management for DORA compliance
 * Article 19 - Major ICT-related incident reporting
 * Requires DORA Professional license for access.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Clock, FileText, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IncidentList } from '@/components/incidents';
import { getIncidents, getIncidentStats, getPendingDeadlines } from '@/lib/incidents/queries';
import { DeadlineBadgeStatic } from '@/components/incidents/deadline-badge';
import { getReportTypeLabel } from '@/lib/incidents/types';
import { getOrganization } from '@/lib/org/context';
import { hasModuleAccess } from '@/lib/licensing/check-access-server';
import { LockedModule } from '@/components/licensing/locked-module';

export const metadata = {
  title: 'Incidents | DORA Comply',
  description: 'ICT incident reporting and management',
};

// Stats Cards Component
async function IncidentStatsCards() {
  const { data: stats } = await getIncidentStats();

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Incidents',
      value: stats.total,
      icon: AlertTriangle,
      description: 'All recorded incidents',
    },
    {
      title: 'Active Incidents',
      value: (stats.by_status.detected || 0) + (stats.by_status.draft || 0),
      icon: Activity,
      description: 'Requiring attention',
      highlight: true,
    },
    {
      title: 'Pending Reports',
      value: stats.pending_reports,
      icon: FileText,
      description: 'Awaiting submission',
    },
    {
      title: 'Overdue Reports',
      value: stats.overdue_reports,
      icon: Clock,
      description: 'Past deadline',
      variant: stats.overdue_reports > 0 ? 'destructive' : 'default',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className={stat.highlight ? 'border-primary/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.variant === 'destructive' && stat.value > 0 ? (
                <span className="text-destructive">{stat.value}</span>
              ) : (
                stat.value
              )}
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

// Pending Deadlines Component
async function PendingDeadlinesCard() {
  const { data: deadlines } = await getPendingDeadlines(5);

  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>Reports due soon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <Link
              key={`${deadline.incident_id}-${deadline.report_type}`}
              href={`/incidents/${deadline.incident_id}`}
              className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{deadline.incident_title}</p>
                <p className="text-xs text-muted-foreground">
                  {deadline.incident_ref} · {getReportTypeLabel(deadline.report_type)}
                </p>
              </div>
              <DeadlineBadgeStatic deadline={deadline.deadline} className="shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Incidents List Component
async function IncidentsListSection() {
  const { data: incidents } = await getIncidents();

  if (!incidents || incidents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Incidents Reported</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Start by reporting your first ICT-related incident. The system will guide you
            through the DORA Article 19 reporting requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" />
              Report First Incident
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <IncidentList incidents={incidents} />;
}

function IncidentsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Locked state component
function IncidentsLockedState() {
  return (
    <LockedModule
      framework="dora"
      moduleName="ICT Incident Reporting"
      features={[
        'Article 19 compliant incident classification',
        'Automated deadline tracking (4h/72h/1m)',
        'Initial, Intermediate & Final report workflows',
        'Impact assessment with DORA criteria',
        'Regulatory submission tracking',
        'Incident timeline and audit trail',
      ]}
      upgradeTier="professional"
    />
  );
}

export default async function IncidentsPage() {
  // Check license access
  const org = await getOrganization();
  if (!org) {
    return <IncidentsLockedState />;
  }

  const hasAccess = await hasModuleAccess(org.id, 'dora', 'incidents');
  if (!hasAccess) {
    return <IncidentsLockedState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground">
            Track and report ICT-related incidents per DORA Article 19
          </p>
        </div>
        <Button asChild>
          <Link href="/incidents/new">
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <IncidentStatsCards />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Incidents List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">All Incidents</h2>
          <Suspense fallback={<IncidentsListSkeleton />}>
            <IncidentsListSection />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <PendingDeadlinesCard />
          </Suspense>

          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DORA Reporting Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Initial Report</span>
                <Badge variant="outline">4 hours</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intermediate Report</span>
                <Badge variant="outline">72 hours</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Final Report</span>
                <Badge variant="outline">1 month</Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Major incidents must be reported to the competent authority within these timeframes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
