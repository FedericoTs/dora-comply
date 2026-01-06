/**
 * Incident Export API
 *
 * GET: Export incident data as PDF in DORA-compliant format
 *
 * Supports three report types:
 * - initial: 4-hour notification
 * - intermediate: 72-hour update
 * - final: 1-month complete report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIncidentById, getIncidentReports, getIncidentEvents } from '@/lib/incidents/queries';
import {
  getClassificationLabel,
  getStatusLabel,
  getIncidentTypeLabel,
  getReportTypeLabel,
  type ReportType,
} from '@/lib/incidents/types';

interface ExportParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: ExportParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get report type from query params
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') as ReportType | null;
    const format = searchParams.get('format') || 'pdf';

    // Fetch incident data
    const [incidentResult, reportsResult, eventsResult] = await Promise.all([
      getIncidentById(id),
      getIncidentReports(id),
      getIncidentEvents(id),
    ]);

    if (!incidentResult.data) {
      return NextResponse.json(
        { error: { message: 'Incident not found' } },
        { status: 404 }
      );
    }

    const incident = incidentResult.data;
    const reports = reportsResult.data;
    const events = eventsResult.data;

    // Get organization details
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization:organizations(id, name, lei)')
      .eq('user_id', user.id)
      .single();

    const organization = (member?.organization as { id: string; name: string; lei: string | null }) || null;

    // Format data for export
    const exportData = buildExportData(incident, reports, events, organization, reportType);

    if (format === 'json') {
      // Return JSON for preview or API consumption
      return NextResponse.json({ data: exportData });
    }

    // Generate PDF
    const pdfBuffer = await generateIncidentPdf(exportData, reportType);

    // Return PDF
    const fileName = `${incident.incident_ref}_${reportType || 'summary'}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Incident export error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to export incident' } },
      { status: 500 }
    );
  }
}

interface ExportData {
  // Header
  reportTitle: string;
  reportType: string | null;
  generatedAt: string;
  organization: {
    name: string;
    lei: string | null;
  } | null;

  // Incident Summary
  incident: {
    ref: string;
    title: string;
    classification: string;
    classificationLabel: string;
    type: string;
    typeLabel: string;
    status: string;
    statusLabel: string;
    description: string | null;
  };

  // Timeline
  timeline: {
    detected: string;
    occurred: string | null;
    recovered: string | null;
    resolved: string | null;
    durationHours: number | null;
  };

  // Impact Assessment
  impact: {
    clientsAffected: number | null;
    clientsPercentage: number | null;
    transactionsAffected: number | null;
    transactionValue: number | null;
    economicImpact: number | null;
    dataBreachFlag: boolean;
    dataRecordsAffected: number | null;
    reputationalImpact: string | null;
    servicesAffected: string[];
    criticalFunctions: string[];
    geographicSpread: string[];
  };

  // Vendor
  vendor: {
    name: string;
    lei: string | null;
  } | null;

  // Root Cause & Remediation
  analysis: {
    rootCause: string | null;
    remediationActions: string | null;
    lessonsLearned: string | null;
  };

  // Classification Override
  classificationOverride: {
    isOverride: boolean;
    calculatedClassification: string | null;
    justification: string | null;
  };

  // Reports
  reports: {
    type: string;
    typeLabel: string;
    status: string;
    version: number;
    deadline: string;
    submittedAt: string | null;
  }[];

  // Events (timeline)
  events: {
    type: string;
    datetime: string;
    description: string | null;
  }[];
}

function buildExportData(
  incident: Awaited<ReturnType<typeof getIncidentById>>['data'],
  reports: Awaited<ReturnType<typeof getIncidentReports>>['data'],
  events: Awaited<ReturnType<typeof getIncidentEvents>>['data'],
  organization: { id: string; name: string; lei: string | null } | null,
  reportType: ReportType | null
): ExportData {
  if (!incident) throw new Error('Incident required');

  return {
    reportTitle: reportType
      ? `DORA ${getReportTypeLabel(reportType)} - ${incident.incident_ref}`
      : `Incident Summary - ${incident.incident_ref}`,
    reportType,
    generatedAt: new Date().toISOString(),
    organization: organization
      ? { name: organization.name, lei: organization.lei }
      : null,

    incident: {
      ref: incident.incident_ref,
      title: incident.title,
      classification: incident.classification,
      classificationLabel: getClassificationLabel(incident.classification),
      type: incident.incident_type,
      typeLabel: getIncidentTypeLabel(incident.incident_type),
      status: incident.status,
      statusLabel: getStatusLabel(incident.status),
      description: incident.description,
    },

    timeline: {
      detected: incident.detection_datetime,
      occurred: incident.occurrence_datetime,
      recovered: incident.recovery_datetime,
      resolved: incident.resolution_datetime,
      durationHours: incident.duration_hours,
    },

    impact: {
      clientsAffected: incident.clients_affected_count,
      clientsPercentage: incident.clients_affected_percentage,
      transactionsAffected: incident.transactions_affected_count,
      transactionValue: incident.transactions_value_affected,
      economicImpact: incident.economic_impact,
      dataBreachFlag: incident.data_breach,
      dataRecordsAffected: incident.data_records_affected,
      reputationalImpact: incident.reputational_impact,
      servicesAffected: incident.services_affected,
      criticalFunctions: incident.critical_functions_affected,
      geographicSpread: incident.geographic_spread,
    },

    vendor: incident.vendor
      ? { name: incident.vendor.name, lei: incident.vendor.lei }
      : null,

    analysis: {
      rootCause: incident.root_cause,
      remediationActions: incident.remediation_actions,
      lessonsLearned: incident.lessons_learned,
    },

    classificationOverride: {
      isOverride: incident.classification_override,
      calculatedClassification: incident.classification_calculated,
      justification: incident.classification_override_justification,
    },

    reports: reports.map((r) => ({
      type: r.report_type,
      typeLabel: getReportTypeLabel(r.report_type),
      status: r.status,
      version: r.version,
      deadline: r.deadline,
      submittedAt: r.submitted_at,
    })),

    events: events.map((e) => ({
      type: e.event_type,
      datetime: e.event_datetime,
      description: e.description,
    })),
  };
}

async function generateIncidentPdf(
  data: ExportData,
  reportType: ReportType | null
): Promise<Buffer> {
  // Simple HTML-to-PDF approach using inline styles
  // In production, use a library like @react-pdf/renderer, puppeteer, or jsPDF

  const html = buildPdfHtml(data, reportType);

  // For now, return a basic text representation
  // A full implementation would use puppeteer or similar
  const textContent = buildTextContent(data, reportType);

  // Return as UTF-8 text buffer (will be replaced with actual PDF)
  return Buffer.from(textContent, 'utf-8');
}

function buildTextContent(data: ExportData, reportType: ReportType | null): string {
  const lines: string[] = [];
  const hr = '='.repeat(60);
  const sr = '-'.repeat(40);

  // Header
  lines.push(hr);
  lines.push(data.reportTitle.toUpperCase());
  lines.push(hr);
  lines.push('');
  lines.push(`Generated: ${new Date(data.generatedAt).toLocaleString('en-GB')}`);
  if (data.organization) {
    lines.push(`Organization: ${data.organization.name}`);
    if (data.organization.lei) {
      lines.push(`LEI: ${data.organization.lei}`);
    }
  }
  lines.push('');

  // DORA Compliance Header
  lines.push(sr);
  lines.push('DORA ARTICLE 19 - ICT-RELATED INCIDENT NOTIFICATION');
  lines.push(sr);
  lines.push('');

  // Incident Summary
  lines.push('1. INCIDENT IDENTIFICATION');
  lines.push(sr);
  lines.push(`Reference:      ${data.incident.ref}`);
  lines.push(`Classification: ${data.incident.classificationLabel}`);
  lines.push(`Type:           ${data.incident.typeLabel}`);
  lines.push(`Status:         ${data.incident.statusLabel}`);
  lines.push(`Title:          ${data.incident.title}`);
  if (data.incident.description) {
    lines.push(`Description:    ${data.incident.description}`);
  }
  lines.push('');

  // Timeline
  lines.push('2. INCIDENT TIMELINE');
  lines.push(sr);
  lines.push(`Detection:      ${formatDateTime(data.timeline.detected)}`);
  if (data.timeline.occurred) {
    lines.push(`Occurrence:     ${formatDateTime(data.timeline.occurred)}`);
  }
  if (data.timeline.recovered) {
    lines.push(`Recovery:       ${formatDateTime(data.timeline.recovered)}`);
  }
  if (data.timeline.resolved) {
    lines.push(`Resolution:     ${formatDateTime(data.timeline.resolved)}`);
  }
  if (data.timeline.durationHours) {
    lines.push(`Duration:       ${data.timeline.durationHours} hours`);
  }
  lines.push('');

  // Impact Assessment
  lines.push('3. IMPACT ASSESSMENT');
  lines.push(sr);
  if (data.impact.clientsAffected !== null) {
    const pct = data.impact.clientsPercentage !== null
      ? ` (${data.impact.clientsPercentage}%)`
      : '';
    lines.push(`Clients Affected:       ${data.impact.clientsAffected.toLocaleString()}${pct}`);
  }
  if (data.impact.transactionsAffected !== null) {
    lines.push(`Transactions Affected:  ${data.impact.transactionsAffected.toLocaleString()}`);
  }
  if (data.impact.transactionValue !== null) {
    lines.push(`Transaction Value:      EUR ${data.impact.transactionValue.toLocaleString()}`);
  }
  if (data.impact.economicImpact !== null) {
    lines.push(`Economic Impact:        EUR ${data.impact.economicImpact.toLocaleString()}`);
  }
  if (data.impact.dataBreachFlag) {
    lines.push(`Data Breach:            YES`);
    if (data.impact.dataRecordsAffected !== null) {
      lines.push(`Records Affected:       ${data.impact.dataRecordsAffected.toLocaleString()}`);
    }
  }
  if (data.impact.reputationalImpact) {
    lines.push(`Reputational Impact:    ${data.impact.reputationalImpact.toUpperCase()}`);
  }
  lines.push('');

  // Services & Functions
  if (data.impact.servicesAffected.length > 0) {
    lines.push('Services Affected:');
    data.impact.servicesAffected.forEach(s => lines.push(`  - ${s}`));
    lines.push('');
  }
  if (data.impact.criticalFunctions.length > 0) {
    lines.push('Critical Functions Affected:');
    data.impact.criticalFunctions.forEach(f => lines.push(`  - ${f}`));
    lines.push('');
  }
  if (data.impact.geographicSpread.length > 0) {
    lines.push('Geographic Spread:');
    data.impact.geographicSpread.forEach(g => lines.push(`  - ${g}`));
    lines.push('');
  }

  // Third-Party Involvement
  if (data.vendor) {
    lines.push('4. THIRD-PARTY INVOLVEMENT');
    lines.push(sr);
    lines.push(`ICT Provider:   ${data.vendor.name}`);
    if (data.vendor.lei) {
      lines.push(`Provider LEI:   ${data.vendor.lei}`);
    }
    lines.push('');
  }

  // Root Cause & Remediation
  if (data.analysis.rootCause || data.analysis.remediationActions) {
    lines.push('5. ROOT CAUSE AND REMEDIATION');
    lines.push(sr);
    if (data.analysis.rootCause) {
      lines.push(`Root Cause:`);
      lines.push(data.analysis.rootCause);
      lines.push('');
    }
    if (data.analysis.remediationActions) {
      lines.push(`Remediation Actions:`);
      lines.push(data.analysis.remediationActions);
      lines.push('');
    }
    if (data.analysis.lessonsLearned) {
      lines.push(`Lessons Learned:`);
      lines.push(data.analysis.lessonsLearned);
      lines.push('');
    }
  }

  // Classification Override
  if (data.classificationOverride.isOverride) {
    lines.push('6. CLASSIFICATION OVERRIDE');
    lines.push(sr);
    lines.push(`Original Classification: ${data.classificationOverride.calculatedClassification || 'N/A'}`);
    lines.push(`Override Justification:`);
    lines.push(data.classificationOverride.justification || 'None provided');
    lines.push('');
  }

  // Report History
  if (data.reports.length > 0) {
    lines.push('7. REPORT SUBMISSION HISTORY');
    lines.push(sr);
    data.reports.forEach(r => {
      const submitted = r.submittedAt
        ? `Submitted: ${formatDateTime(r.submittedAt)}`
        : `Deadline: ${formatDateTime(r.deadline)}`;
      lines.push(`${r.typeLabel} (v${r.version}) - ${r.status.toUpperCase()} - ${submitted}`);
    });
    lines.push('');
  }

  // Footer
  lines.push(hr);
  lines.push('END OF REPORT');
  lines.push(`Generated by DORA Comply - ${new Date().toISOString()}`);
  lines.push(hr);

  return lines.join('\n');
}

function buildPdfHtml(data: ExportData, reportType: ReportType | null): string {
  // HTML template for PDF generation (for future puppeteer/wkhtmltopdf integration)
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.reportTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 40px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e07a5f; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .header { background: #f9fafb; padding: 20px; border-left: 4px solid #e07a5f; margin-bottom: 30px; }
    .classification-major { color: #dc2626; font-weight: bold; }
    .classification-significant { color: #d97706; font-weight: bold; }
    .classification-minor { color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f3f4f6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>${data.reportTitle}</h1>
  <div class="header">
    <strong>DORA Article 19 - ICT-Related Incident Notification</strong><br>
    Generated: ${new Date(data.generatedAt).toLocaleString('en-GB')}<br>
    ${data.organization ? `Organization: ${data.organization.name}` : ''}
  </div>
  <!-- Content would continue... -->
</body>
</html>
  `;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
