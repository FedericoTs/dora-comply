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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Get organization details from users table
    const { data: userRecord } = await supabase
      .from('users')
      .select('organization:organizations(id, name, lei)')
      .eq('id', user.id)
      .single();

    // Handle the nested relation - Supabase may return array or object for relations
    type OrgType = { id: string; name: string; lei: string | null };
    const orgRaw = userRecord?.organization;
    const organization: OrgType | null = orgRaw
      ? (Array.isArray(orgRaw) ? orgRaw[0] as OrgType : orgRaw as OrgType)
      : null;

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

    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _reportType: ReportType | null // Reserved for future report type-specific formatting
): Promise<Buffer> {
  // Create PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [224, 122, 95]; // #E07A5F
  const darkColor: [number, number, number] = [26, 26, 26];
  const grayColor: [number, number, number] = [107, 114, 128];

  // Helper function to add a new page if needed
  const checkPage = (requiredSpace: number = 40): void => {
    if (y + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper function to add a section header
  const addSectionHeader = (title: string): void => {
    checkPage(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 8;
  };

  // Helper function to add a key-value pair
  const addField = (label: string, value: string | null | undefined): void => {
    if (!value) return;
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayColor);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    const splitValue = doc.splitTextToSize(value, contentWidth - 45);
    doc.text(splitValue, margin + 45, y);
    y += 5 * Math.max(1, splitValue.length);
  };

  // ===== HEADER =====
  // Logo/Title bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DORA Comply', margin, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ICT Incident Report - Article 19', margin, 23);

  // Classification badge
  const classColor = getClassificationColor(data.incident.classification);
  doc.setFillColor(...classColor);
  doc.roundedRect(pageWidth - margin - 35, 10, 35, 15, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.incident.classificationLabel.toUpperCase(), pageWidth - margin - 32, 19);

  y = 45;

  // Document info box
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, y, contentWidth, 25, 'FD');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(data.reportTitle, margin + 5, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  const infoLine = [
    `Reference: ${data.incident.ref}`,
    data.organization?.name ? `Organization: ${data.organization.name}` : null,
    `Generated: ${formatDateTime(data.generatedAt)}`,
  ].filter(Boolean).join('  |  ');
  doc.text(infoLine, margin + 5, y + 18);

  y += 35;

  // ===== 1. INCIDENT IDENTIFICATION =====
  addSectionHeader('1. INCIDENT IDENTIFICATION');
  addField('Reference:', data.incident.ref);
  addField('Title:', data.incident.title);
  addField('Classification:', data.incident.classificationLabel);
  addField('Type:', data.incident.typeLabel);
  addField('Status:', data.incident.statusLabel);
  if (data.incident.description) {
    addField('Description:', data.incident.description);
  }
  if (data.organization?.lei) {
    addField('Entity LEI:', data.organization.lei);
  }
  y += 5;

  // ===== 2. INCIDENT TIMELINE =====
  addSectionHeader('2. INCIDENT TIMELINE');

  // Timeline table
  checkPage(30);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Event', 'Date/Time']],
    body: [
      ['Detection', formatDateTime(data.timeline.detected)],
      ...(data.timeline.occurred ? [['Occurrence', formatDateTime(data.timeline.occurred)]] : []),
      ...(data.timeline.recovered ? [['Recovery', formatDateTime(data.timeline.recovered)]] : []),
      ...(data.timeline.resolved ? [['Resolution', formatDateTime(data.timeline.resolved)]] : []),
      ...(data.timeline.durationHours ? [['Total Duration', `${data.timeline.durationHours} hours`]] : []),
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    theme: 'grid',
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ===== 3. IMPACT ASSESSMENT =====
  addSectionHeader('3. IMPACT ASSESSMENT');

  // Impact metrics
  const impactRows: [string, string][] = [];
  if (data.impact.clientsAffected !== null) {
    const pct = data.impact.clientsPercentage !== null ? ` (${data.impact.clientsPercentage}%)` : '';
    impactRows.push(['Clients Affected', `${data.impact.clientsAffected.toLocaleString()}${pct}`]);
  }
  if (data.impact.transactionsAffected !== null) {
    impactRows.push(['Transactions Affected', data.impact.transactionsAffected.toLocaleString()]);
  }
  if (data.impact.transactionValue !== null) {
    impactRows.push(['Transaction Value (EUR)', `€${data.impact.transactionValue.toLocaleString()}`]);
  }
  if (data.impact.economicImpact !== null) {
    impactRows.push(['Economic Impact (EUR)', `€${data.impact.economicImpact.toLocaleString()}`]);
  }
  if (data.impact.dataBreachFlag) {
    impactRows.push(['Data Breach', 'YES']);
    if (data.impact.dataRecordsAffected !== null) {
      impactRows.push(['Data Records Affected', data.impact.dataRecordsAffected.toLocaleString()]);
    }
  }
  if (data.impact.reputationalImpact) {
    impactRows.push(['Reputational Impact', data.impact.reputationalImpact.toUpperCase()]);
  }

  if (impactRows.length > 0) {
    checkPage(impactRows.length * 8 + 15);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value']],
      body: impactRows,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      theme: 'grid',
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Services & Functions
  if (data.impact.servicesAffected.length > 0) {
    checkPage(15);
    addField('Services Affected:', data.impact.servicesAffected.join(', '));
  }
  if (data.impact.criticalFunctions.length > 0) {
    checkPage(15);
    addField('Critical Functions:', data.impact.criticalFunctions.join(', '));
  }
  if (data.impact.geographicSpread.length > 0) {
    checkPage(15);
    addField('Geographic Spread:', data.impact.geographicSpread.join(', '));
  }
  y += 5;

  // ===== 4. THIRD-PARTY INVOLVEMENT =====
  if (data.vendor) {
    addSectionHeader('4. THIRD-PARTY INVOLVEMENT');
    addField('ICT Provider:', data.vendor.name);
    if (data.vendor.lei) {
      addField('Provider LEI:', data.vendor.lei);
    }
    y += 5;
  }

  // ===== 5. ROOT CAUSE & REMEDIATION =====
  if (data.analysis.rootCause || data.analysis.remediationActions || data.analysis.lessonsLearned) {
    addSectionHeader('5. ROOT CAUSE AND REMEDIATION');
    if (data.analysis.rootCause) {
      addField('Root Cause:', data.analysis.rootCause);
    }
    if (data.analysis.remediationActions) {
      addField('Remediation:', data.analysis.remediationActions);
    }
    if (data.analysis.lessonsLearned) {
      addField('Lessons Learned:', data.analysis.lessonsLearned);
    }
    y += 5;
  }

  // ===== 6. CLASSIFICATION OVERRIDE =====
  if (data.classificationOverride.isOverride) {
    addSectionHeader('6. CLASSIFICATION OVERRIDE');
    addField('Original Class.:', data.classificationOverride.calculatedClassification || 'N/A');
    addField('Justification:', data.classificationOverride.justification || 'None provided');
    y += 5;
  }

  // ===== 7. REPORT HISTORY =====
  if (data.reports.length > 0) {
    addSectionHeader('7. REPORT SUBMISSION HISTORY');
    checkPage(data.reports.length * 8 + 15);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Report Type', 'Version', 'Status', 'Date']],
      body: data.reports.map((r) => [
        r.typeLabel,
        `v${r.version}`,
        r.status.toUpperCase(),
        r.submittedAt ? formatDateTime(r.submittedAt) : `Due: ${formatDateTime(r.deadline)}`,
      ]),
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      theme: 'grid',
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(`DORA Comply - Confidential`, margin, footerY);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, footerY);
    doc.text(new Date().toISOString().split('T')[0], pageWidth / 2 - 10, footerY);
  }

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// Get color based on classification
function getClassificationColor(classification: string): [number, number, number] {
  switch (classification) {
    case 'major':
      return [220, 38, 38]; // Red
    case 'significant':
      return [217, 119, 6]; // Orange
    default:
      return [107, 114, 128]; // Gray
  }
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
