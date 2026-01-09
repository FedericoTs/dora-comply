/**
 * Incident Detail Page
 *
 * Full incident view with timeline, reports, and actions
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  AlertTriangle,
  Shield,
  Info,
  Calendar,
  Clock,
  Building2,
  Users,
  Globe,
  FileText,
  Activity,
  Edit,
  Plus,
  Database,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getIncidentById, getIncidentReports, getIncidentEvents } from '@/lib/incidents/queries';
import {
  getClassificationLabel,
  getStatusLabel,
  getIncidentTypeLabel,
  getReportTypeLabel,
  calculateDeadline,
} from '@/lib/incidents/types';
import { DeadlineBadgeStatic } from '@/components/incidents/deadline-badge';
import { DeleteIncidentButton } from '@/components/incidents/delete-incident-button';
import { IncidentExportButton } from '@/components/incidents/incident-export-button';
import { IncidentLifecycle } from '@/components/incidents/incident-lifecycle';

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const { data: incident } = await getIncidentById(id);
  if (!incident) {
    return { title: 'Incident Not Found | DORA Comply' };
  }
  return {
    title: `${incident.incident_ref} - ${incident.title} | DORA Comply`,
    description: `Incident details for ${incident.incident_ref}`,
  };
}

function getClassificationIcon(classification: string) {
  switch (classification) {
    case 'major':
      return AlertTriangle;
    case 'significant':
      return Shield;
    default:
      return Info;
  }
}

function getClassificationStyles(classification: string) {
  switch (classification) {
    case 'major':
      return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400';
    case 'significant':
      return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-600';
    case 'detected':
      return 'bg-amber-100 text-amber-700';
    case 'initial_submitted':
    case 'intermediate_submitted':
      return 'bg-blue-100 text-blue-700';
    case 'final_submitted':
      return 'bg-green-100 text-green-700';
    case 'closed':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = await params;
  const [incidentResult, reportsResult, eventsResult] = await Promise.all([
    getIncidentById(id),
    getIncidentReports(id),
    getIncidentEvents(id),
  ]);

  const incident = incidentResult.data;
  const reports = reportsResult.data;
  const events = eventsResult.data;

  if (!incident) {
    notFound();
  }

  const ClassificationIcon = getClassificationIcon(incident.classification);
  const detectionDate = new Date(incident.detection_datetime);

  const deadlines = {
    initial: calculateDeadline(detectionDate, 'initial'),
    intermediate: calculateDeadline(detectionDate, 'intermediate'),
    final: calculateDeadline(detectionDate, 'final'),
  };

  // Determine next required report
  const getNextReport = () => {
    const submitted = reports.filter((r) => r.status === 'submitted' || r.status === 'acknowledged');
    const hasInitial = submitted.some((r) => r.report_type === 'initial');
    const hasIntermediate = submitted.some((r) => r.report_type === 'intermediate');
    const hasFinal = submitted.some((r) => r.report_type === 'final');

    if (!hasInitial) return { type: 'initial', deadline: deadlines.initial };
    if (!hasIntermediate) return { type: 'intermediate', deadline: deadlines.intermediate };
    if (!hasFinal) return { type: 'final', deadline: deadlines.final };
    return null;
  };

  const nextReport = incident.classification === 'major' ? getNextReport() : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/incidents">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-muted-foreground">
                {incident.incident_ref}
              </span>
              <Badge variant="outline" className={getStatusStyles(incident.status)}>
                {getStatusLabel(incident.status)}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{incident.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <IncidentExportButton
            incidentId={incident.id}
            incidentRef={incident.incident_ref}
            classification={incident.classification}
          />
          <Button variant="outline" asChild>
            <Link href={`/incidents/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteIncidentButton
            incidentId={incident.id}
            incidentRef={incident.incident_ref}
          />
          {nextReport && (
            <Button asChild>
              <Link href={`/incidents/${id}/reports/new?type=${nextReport.type}`}>
                <Plus className="mr-2 h-4 w-4" />
                Create {getReportTypeLabel(nextReport.type as 'initial' | 'intermediate' | 'final')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Classification Badge */}
            <div
              className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-full',
                incident.classification === 'major'
                  ? 'bg-red-100 text-red-600'
                  : incident.classification === 'significant'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              <ClassificationIcon className="h-8 w-8" />
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-sm', getClassificationStyles(incident.classification))}
                >
                  {getClassificationLabel(incident.classification)}
                </Badge>
                <Badge variant="outline">{getIncidentTypeLabel(incident.incident_type)}</Badge>
                {incident.data_breach && <Badge variant="destructive">Data Breach</Badge>}
              </div>

              {incident.description && (
                <p className="text-muted-foreground">{incident.description}</p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Detected:{' '}
                    {detectionDate.toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {incident.vendor && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/vendors/${incident.vendor.id}`}
                      className="text-primary hover:underline"
                    >
                      {incident.vendor.name}
                    </Link>
                  </div>
                )}
                {incident.duration_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{incident.duration_hours}h duration</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Deadline */}
            {nextReport && (
              <div className="lg:text-right">
                <p className="text-xs text-muted-foreground mb-1">Next Deadline</p>
                <DeadlineBadgeStatic deadline={nextReport.deadline} />
                <p className="text-xs text-muted-foreground mt-1">
                  {getReportTypeLabel(nextReport.type as 'initial' | 'intermediate' | 'final')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Diagram */}
      <Card>
        <CardContent className="pt-6">
          <IncidentLifecycle
            classification={incident.classification}
            detectionDatetime={detectionDate}
            reports={reports.map(r => ({
              report_type: r.report_type as 'initial' | 'intermediate' | 'final',
              status: r.status as 'draft' | 'submitted' | 'acknowledged' | 'rejected',
              deadline: new Date(r.deadline),
              submitted_at: r.submitted_at,
            }))}
            incidentStatus={incident.status}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Impact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Impact Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incident.clients_affected_count !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clients Affected</span>
                    <span className="font-medium">
                      {incident.clients_affected_count.toLocaleString()}
                      {incident.clients_affected_percentage !== null &&
                        ` (${incident.clients_affected_percentage}%)`}
                    </span>
                  </div>
                )}
                {incident.transactions_affected_count !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transactions</span>
                    <span className="font-medium">
                      {incident.transactions_affected_count.toLocaleString()}
                    </span>
                  </div>
                )}
                {incident.transactions_value_affected !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value Affected</span>
                    <span className="font-medium">
                      €{incident.transactions_value_affected.toLocaleString()}
                    </span>
                  </div>
                )}
                {incident.economic_impact !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Economic Impact</span>
                    <span className="font-medium">
                      €{incident.economic_impact.toLocaleString()}
                    </span>
                  </div>
                )}
                {incident.data_breach && incident.data_records_affected !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Records</span>
                    <span className="font-medium text-destructive">
                      {incident.data_records_affected.toLocaleString()}
                    </span>
                  </div>
                )}
                {incident.reputational_impact && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reputational</span>
                    <Badge variant="outline" className="capitalize">
                      {incident.reputational_impact}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services & Functions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Affected Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incident.services_affected.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {incident.services_affected.map((service) => (
                        <Badge key={service} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {incident.critical_functions_affected.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Critical Functions</p>
                    <div className="flex flex-wrap gap-1">
                      {incident.critical_functions_affected.map((fn) => (
                        <Badge key={fn} variant="outline" className="border-amber-500">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {incident.geographic_spread.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Geographic Spread</p>
                    <div className="flex flex-wrap gap-1">
                      {incident.geographic_spread.map((region) => (
                        <Badge key={region} variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Root Cause & Remediation */}
            {(incident.root_cause || incident.remediation_actions) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Analysis & Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incident.root_cause && (
                    <div>
                      <p className="text-sm font-medium mb-1">Root Cause</p>
                      <p className="text-sm text-muted-foreground">{incident.root_cause}</p>
                    </div>
                  )}
                  {incident.remediation_actions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Remediation Actions</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.remediation_actions}
                      </p>
                    </div>
                  )}
                  {incident.lessons_learned && (
                    <div>
                      <p className="text-sm font-medium mb-1">Lessons Learned</p>
                      <p className="text-sm text-muted-foreground">{incident.lessons_learned}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Timeline</CardTitle>
              <CardDescription>Chronological events for this incident</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No timeline events recorded yet.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-muted space-y-6">
                  {events.map((event, index) => (
                    <div key={event.id} className="relative">
                      <div
                        className={cn(
                          'absolute -left-[25px] h-4 w-4 rounded-full border-2',
                          index === 0
                            ? 'border-primary bg-primary'
                            : 'border-muted bg-background'
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.event_datetime).toLocaleString('en-GB')}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Regulatory Reports</h3>
            {nextReport && (
              <Button size="sm" asChild>
                <Link href={`/incidents/${id}/reports/new?type=${nextReport.type}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Link>
              </Button>
            )}
          </div>

          {reports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No Reports Yet</h3>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
                  {incident.classification === 'major'
                    ? 'Major incidents require initial, intermediate, and final reports.'
                    : 'Minor incidents do not require regulatory reporting.'}
                </p>
                {nextReport && (
                  <Button className="mt-4" asChild>
                    <Link href={`/incidents/${id}/reports/new?type=${nextReport.type}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create {getReportTypeLabel(nextReport.type as 'initial' | 'intermediate' | 'final')}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {getReportTypeLabel(report.report_type)}
                      </CardTitle>
                      <Badge
                        variant={
                          report.status === 'submitted' || report.status === 'acknowledged'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <CardDescription>Version {report.version}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline</span>
                        <span>{new Date(report.deadline).toLocaleDateString('en-GB')}</span>
                      </div>
                      {report.submitted_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submitted</span>
                          <span>
                            {new Date(report.submitted_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
