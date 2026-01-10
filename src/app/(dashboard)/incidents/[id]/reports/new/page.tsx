/**
 * New Incident Report Page
 *
 * Create DORA-compliant incident reports (initial, intermediate, final)
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIncidentById } from '@/lib/incidents/queries';
import { getReportTypeLabel, calculateDeadline, type ReportType } from '@/lib/incidents/types';
import { ReportForm } from './report-form';

interface NewReportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({ params, searchParams }: NewReportPageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { data: incident } = await getIncidentById(id);

  if (!incident) {
    return { title: 'Incident Not Found | DORA Comply' };
  }

  const reportType = resolvedSearchParams.type as ReportType | undefined;
  const reportLabel = reportType ? getReportTypeLabel(reportType) : 'Report';

  return {
    title: `Create ${reportLabel} - ${incident.incident_ref} | DORA Comply`,
    description: `Create a new ${reportLabel.toLowerCase()} for incident ${incident.incident_ref}`,
  };
}

export default async function NewReportPage({ params, searchParams }: NewReportPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { data: incident } = await getIncidentById(id);

  if (!incident) {
    notFound();
  }

  // Get report type from query params, default to initial
  const reportType = (resolvedSearchParams.type as ReportType) || 'initial';
  const validTypes: ReportType[] = ['initial', 'intermediate', 'final'];
  const selectedType = validTypes.includes(reportType) ? reportType : 'initial';

  // Calculate deadline for this report type
  const detectionDate = new Date(incident.detection_datetime);
  const deadline = calculateDeadline(detectionDate, selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/incidents/${id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">
              {incident.incident_ref}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create {getReportTypeLabel(selectedType)}
          </h1>
          <p className="text-muted-foreground">
            {incident.title}
          </p>
        </div>
      </div>

      {/* Report Form */}
      <ReportForm
        incidentId={id}
        incidentRef={incident.incident_ref}
        incidentTitle={incident.title}
        incidentDescription={incident.description}
        classification={incident.classification}
        incidentType={incident.incident_type}
        detectionDatetime={incident.detection_datetime}
        reportType={selectedType}
        deadline={deadline}
        servicesAffected={incident.services_affected}
        criticalFunctionsAffected={incident.critical_functions_affected}
        clientsAffectedCount={incident.clients_affected_count}
        clientsAffectedPercentage={incident.clients_affected_percentage}
        transactionsAffectedCount={incident.transactions_affected_count}
        transactionsValueAffected={incident.transactions_value_affected}
        dataBreach={incident.data_breach}
        dataRecordsAffected={incident.data_records_affected}
        geographicSpread={incident.geographic_spread}
        economicImpact={incident.economic_impact}
        rootCause={incident.root_cause}
        remediationActions={incident.remediation_actions}
        vendor={incident.vendor}
      />
    </div>
  );
}
