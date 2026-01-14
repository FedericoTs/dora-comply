/**
 * Incident Detail Page
 *
 * Full incident view with timeline, reports, and actions
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getIncidentById, getIncidentReports, getIncidentEvents } from '@/lib/incidents/queries';
import { getReportTypeLabel, calculateDeadline } from '@/lib/incidents/types';
import { DeleteIncidentButton } from '@/components/incidents/delete-incident-button';
import { IncidentExportButton } from '@/components/incidents/incident-export-button';
import { IncidentLifecycle } from '@/components/incidents/incident-lifecycle';
import { IncidentStatusDropdown } from '@/components/incidents/incident-status-dropdown';
import {
  IncidentHeroCard,
  ImpactAssessmentCard,
  AffectedSystemsCard,
  AnalysisResponseCard,
  TimelineTab,
  ReportsTab,
} from './components';

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
              <IncidentStatusDropdown
                incidentId={incident.id}
                currentStatus={incident.status}
                classification={incident.classification}
              />
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
      <IncidentHeroCard
        incident={incident}
        detectionDate={detectionDate}
        nextReport={nextReport}
      />

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
            <ImpactAssessmentCard incident={incident} />
            <AffectedSystemsCard incident={incident} />
            <AnalysisResponseCard incident={incident} />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <TimelineTab incidentId={incident.id} events={events} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab
            incidentId={id}
            incident={incident}
            reports={reports}
            nextReport={nextReport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
