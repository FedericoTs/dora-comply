/**
 * Board Report PDF Generator
 *
 * Generates executive-level PDF reports for board presentations.
 * 6 pages: Cover, Executive Summary, DORA Compliance, Concentration Risk,
 * Vendor Portfolio, Action Items.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BoardReportData } from './board-report-types';
import { COLORS, MATURITY_LABELS, PILLAR_LABELS } from './board-report-types';

/**
 * Generate PDF board report
 */
export function generateBoardReportPDF(data: BoardReportData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  drawCoverPage(doc, data, pageWidth, pageHeight);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawExecutiveSummary(doc, data);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3: DORA COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawDORACompliance(doc, data);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4: CONCENTRATION RISK
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawConcentrationRisk(doc, data);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5: VENDOR PORTFOLIO
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawVendorPortfolio(doc, data);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 6: ACTION ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawActionItems(doc, data, pageWidth);

  // Add page numbers to all pages
  addPageNumbers(doc);

  return doc.output('blob');
}

/**
 * Draw cover page
 */
function drawCoverPage(
  doc: jsPDF,
  data: BoardReportData,
  pageWidth: number,
  pageHeight: number
): void {
  // Background accent
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Title
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text('DORA Compliance', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(24);
  doc.text('Board Report', pageWidth / 2, 55, { align: 'center' });

  // Organization name
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.dark);
  doc.text(data.organization.name, pageWidth / 2, 110, { align: 'center' });

  // Reporting period
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray);
  const periodText = `Reporting Period: ${formatDate(data.reportingPeriod.from)} - ${formatDate(data.reportingPeriod.to)}`;
  doc.text(periodText, pageWidth / 2, 125, { align: 'center' });

  // Generated date
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, pageWidth / 2, 135, {
    align: 'center',
  });

  // Key metrics box
  const boxY = 160;
  const boxHeight = 80;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, boxY, pageWidth - 40, boxHeight, 5, 5, 'F');

  // Metrics in box
  const metrics = [
    { label: 'Compliance Score', value: `${data.executiveSummary.overallComplianceScore}%` },
    { label: 'Maturity Level', value: data.executiveSummary.doraMaturityLevel },
    { label: 'Critical Vendors', value: data.executiveSummary.criticalVendors.toString() },
    { label: 'Open Incidents', value: data.executiveSummary.openIncidents.toString() },
  ];

  const metricWidth = (pageWidth - 60) / 4;
  metrics.forEach((metric, idx) => {
    const x = 30 + idx * metricWidth;
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.primary);
    doc.text(metric.value, x + metricWidth / 2, boxY + 35, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.text(metric.label, x + metricWidth / 2, boxY + 50, { align: 'center' });
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    'Confidential - For Board Use Only',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );
}

/**
 * Draw executive summary page
 */
function drawExecutiveSummary(
  doc: jsPDF,
  data: BoardReportData
): void {
  let yPos = 25;

  // Page title
  drawPageTitle(doc, 'Executive Summary', yPos);
  yPos += 20;

  // Compliance Score Section
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Overall DORA Compliance', 20, yPos);
  yPos += 10;

  // Score display
  const score = data.executiveSummary.overallComplianceScore;
  const scoreColor = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;

  doc.setFontSize(48);
  doc.setTextColor(...scoreColor);
  doc.text(`${score}%`, 20, yPos + 20);

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    `Maturity Level: ${data.executiveSummary.doraMaturityLevel} (${MATURITY_LABELS[data.executiveSummary.doraMaturityLevel]})`,
    20,
    yPos + 32
  );
  yPos += 50;

  // Key Metrics Table
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Key Metrics', 20, yPos);
  yPos += 5;

  const metricsData = [
    ['Critical Vendors', data.executiveSummary.criticalVendors.toString()],
    ['High Risk Vendors', data.executiveSummary.highRiskVendors.toString()],
    ['Open Incidents', data.executiveSummary.openIncidents.toString()],
    ['Total Vendors', data.vendorSummary.total.toString()],
    ['Pending Assessments', data.vendorSummary.pendingAssessments.toString()],
    ['Expiring Contracts (90d)', data.vendorSummary.expiringContracts.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    body: metricsData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 40 },
    },
    margin: { left: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Key Risks
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Key Risks', 20, yPos);
  yPos += 8;

  if (data.executiveSummary.keyRisks.length > 0) {
    data.executiveSummary.keyRisks.forEach((risk) => {
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.error);
      doc.text('\u2022', 22, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.text(risk, 28, yPos);
      yPos += 7;
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.text('No critical risks identified', 25, yPos);
    yPos += 7;
  }
  yPos += 10;

  // Recommendations
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Recommendations', 20, yPos);
  yPos += 8;

  if (data.executiveSummary.recommendations.length > 0) {
    data.executiveSummary.recommendations.forEach((rec, idx) => {
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primary);
      doc.text(`${idx + 1}.`, 22, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.text(rec, 30, yPos);
      yPos += 7;
    });
  }
}

/**
 * Draw DORA compliance page
 */
function drawDORACompliance(
  doc: jsPDF,
  data: BoardReportData
): void {
  let yPos = 25;

  drawPageTitle(doc, 'DORA Compliance Status', yPos);
  yPos += 20;

  // Pillar coverage table
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Pillar Coverage', 20, yPos);
  yPos += 5;

  const pillarData = data.doraCompliance.pillars.map((p) => [
    PILLAR_LABELS[p.code] || p.name,
    `${p.coverage}%`,
    `${p.controlsImplemented}/${p.controlsTotal}`,
    p.status.charAt(0).toUpperCase() + p.status.slice(1).replace('-', ' '),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['DORA Pillar', 'Coverage', 'Controls', 'Status']],
    body: pillarData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
    styles: { fontSize: 10, cellPadding: 5 },
    margin: { left: 20, right: 20 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const value = (hookData.cell.raw as string).toLowerCase();
        if (value.includes('compliant') && !value.includes('non')) {
          hookData.cell.styles.textColor = COLORS.success;
        } else if (value === 'partial') {
          hookData.cell.styles.textColor = COLORS.warning;
        } else {
          hookData.cell.styles.textColor = COLORS.error;
        }
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Critical Gaps
  if (data.doraCompliance.criticalGaps.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.dark);
    doc.text('Critical Compliance Gaps', 20, yPos);
    yPos += 5;

    const gapData = data.doraCompliance.criticalGaps.map((g) => [
      PILLAR_LABELS[g.pillar] || g.pillar,
      g.gap,
      g.priority.toUpperCase(),
      g.remediationSuggestion || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Pillar', 'Gap', 'Priority', 'Remediation']],
      body: gapData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.error, textColor: COLORS.white },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 'auto' },
      },
      margin: { left: 20, right: 20 },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const value = hookData.cell.raw as string;
          if (value === 'CRITICAL') {
            hookData.cell.styles.textColor = COLORS.error;
          } else if (value === 'HIGH') {
            hookData.cell.styles.textColor = COLORS.warning;
          }
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }
}

/**
 * Draw concentration risk page
 */
function drawConcentrationRisk(
  doc: jsPDF,
  data: BoardReportData
): void {
  let yPos = 25;

  drawPageTitle(doc, 'Concentration Risk Analysis', yPos);
  yPos += 20;

  // HHI Score
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Herfindahl-Hirschman Index (HHI)', 20, yPos);
  yPos += 10;

  const hhi = data.concentrationRisk.hhiScore;
  const hhiColor =
    data.concentrationRisk.hhiCategory === 'low'
      ? COLORS.success
      : data.concentrationRisk.hhiCategory === 'moderate'
      ? COLORS.warning
      : COLORS.error;

  doc.setFontSize(36);
  doc.setTextColor(...hhiColor);
  doc.text(hhi.toLocaleString(), 20, yPos + 15);

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    `${data.concentrationRisk.hhiCategory.toUpperCase()} concentration`,
    70,
    yPos + 8
  );
  doc.setFontSize(9);
  doc.text('<1,500 = Low | 1,500-2,500 = Moderate | >2,500 = High', 70, yPos + 16);
  yPos += 35;

  // Key Metrics
  const concMetrics = [
    ['Single Points of Failure (SPOFs)', data.concentrationRisk.spofsCount.toString()],
    ['Fourth-Party Chain Depth', `${data.concentrationRisk.fourthPartyDepth} levels`],
    ['Geographic Regions', data.concentrationRisk.geographicBreakdown.length.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    body: concMetrics,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 40 },
    },
    margin: { left: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Geographic Breakdown
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Geographic Distribution', 20, yPos);
  yPos += 5;

  const geoData = data.concentrationRisk.geographicBreakdown.map((g) => [
    g.country || g.region,
    `${g.percentage}%`,
    g.vendorCount.toString(),
    g.riskLevel.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Country/Region', 'Share', 'Vendors', 'Risk']],
    body: geoData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
    styles: { fontSize: 10, cellPadding: 4 },
    margin: { left: 20, right: 20 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const value = hookData.cell.raw as string;
        if (value === 'HIGH') {
          hookData.cell.styles.textColor = COLORS.error;
        } else if (value === 'MEDIUM') {
          hookData.cell.styles.textColor = COLORS.warning;
        } else {
          hookData.cell.styles.textColor = COLORS.success;
        }
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Top Risks
  if (data.concentrationRisk.topRisks.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.dark);
    doc.text('Top Concentration Risks', 20, yPos);
    yPos += 8;

    data.concentrationRisk.topRisks.forEach((risk) => {
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.error);
      doc.text('\u2022', 22, yPos);
      doc.setTextColor(...COLORS.dark);
      doc.text(risk, 28, yPos);
      yPos += 7;
    });
  }
}

/**
 * Draw vendor portfolio page
 */
function drawVendorPortfolio(
  doc: jsPDF,
  data: BoardReportData
): void {
  let yPos = 25;

  drawPageTitle(doc, 'Vendor Portfolio Summary', yPos);
  yPos += 20;

  // Total vendors
  doc.setFontSize(36);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.vendorSummary.total.toString(), 20, yPos + 15);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.gray);
  doc.text('Total Vendors', 60, yPos + 8);
  yPos += 35;

  // By Tier
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Distribution by Criticality Tier', 20, yPos);
  yPos += 5;

  const tierData = [
    ['Critical', data.vendorSummary.byTier.critical.toString(), getPercentage(data.vendorSummary.byTier.critical, data.vendorSummary.total)],
    ['Important', data.vendorSummary.byTier.important.toString(), getPercentage(data.vendorSummary.byTier.important, data.vendorSummary.total)],
    ['Standard', data.vendorSummary.byTier.standard.toString(), getPercentage(data.vendorSummary.byTier.standard, data.vendorSummary.total)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Tier', 'Count', '%']],
    body: tierData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } },
    margin: { left: 20 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // By Risk
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Distribution by Risk Level', 20, yPos);
  yPos += 5;

  const riskData = [
    ['Critical', data.vendorSummary.byRisk.critical.toString(), getPercentage(data.vendorSummary.byRisk.critical, data.vendorSummary.total)],
    ['High', data.vendorSummary.byRisk.high.toString(), getPercentage(data.vendorSummary.byRisk.high, data.vendorSummary.total)],
    ['Medium', data.vendorSummary.byRisk.medium.toString(), getPercentage(data.vendorSummary.byRisk.medium, data.vendorSummary.total)],
    ['Low', data.vendorSummary.byRisk.low.toString(), getPercentage(data.vendorSummary.byRisk.low, data.vendorSummary.total)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Risk Level', 'Count', '%']],
    body: riskData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.warning, textColor: COLORS.white },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } },
    margin: { left: 20 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 0) {
        const value = hookData.cell.raw as string;
        if (value === 'Critical') hookData.cell.styles.textColor = COLORS.error;
        else if (value === 'High') hookData.cell.styles.textColor = COLORS.warning;
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Alerts
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text('Attention Required', 20, yPos);
  yPos += 8;

  const alertItems = [
    {
      label: 'Pending Assessments',
      value: data.vendorSummary.pendingAssessments,
      color: data.vendorSummary.pendingAssessments > 0 ? COLORS.warning : COLORS.success,
    },
    {
      label: 'Contracts Expiring (30 days)',
      value: data.vendorSummary.contractsExpiringIn30Days,
      color: data.vendorSummary.contractsExpiringIn30Days > 0 ? COLORS.error : COLORS.success,
    },
    {
      label: 'Contracts Expiring (90 days)',
      value: data.vendorSummary.expiringContracts,
      color: data.vendorSummary.expiringContracts > 2 ? COLORS.warning : COLORS.success,
    },
  ];

  alertItems.forEach((item) => {
    doc.setFontSize(10);
    doc.setTextColor(...item.color);
    doc.text(`\u2022 ${item.label}: `, 22, yPos);
    doc.setTextColor(...COLORS.dark);
    doc.text(item.value.toString(), 90, yPos);
    yPos += 8;
  });
}

/**
 * Draw action items page
 */
function drawActionItems(
  doc: jsPDF,
  data: BoardReportData,
  pageWidth: number
): void {
  let yPos = 25;

  drawPageTitle(doc, 'Action Items', yPos);
  yPos += 15;

  if (data.actionItems.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.gray);
    doc.text('No outstanding action items', pageWidth / 2, yPos + 20, {
      align: 'center',
    });
    return;
  }

  const actionData = data.actionItems.map((item) => [
    item.id,
    item.title,
    item.priority.toUpperCase(),
    item.category.charAt(0).toUpperCase() + item.category.slice(1),
    item.dueDate ? formatDate(item.dueDate) : '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['ID', 'Action', 'Priority', 'Category', 'Due Date']],
    body: actionData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { cellWidth: 28 },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const value = hookData.cell.raw as string;
        if (value === 'CRITICAL') hookData.cell.styles.textColor = COLORS.error;
        else if (value === 'HIGH') hookData.cell.styles.textColor = COLORS.warning;
        else if (value === 'MEDIUM') hookData.cell.styles.textColor = COLORS.info;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Summary by priority
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('Summary by Priority:', 20, yPos);
  yPos += 8;

  const priorityCounts = {
    critical: data.actionItems.filter((i) => i.priority === 'critical').length,
    high: data.actionItems.filter((i) => i.priority === 'high').length,
    medium: data.actionItems.filter((i) => i.priority === 'medium').length,
    low: data.actionItems.filter((i) => i.priority === 'low').length,
  };

  doc.setFontSize(10);
  const summaryText = `Critical: ${priorityCounts.critical} | High: ${priorityCounts.high} | Medium: ${priorityCounts.medium} | Low: ${priorityCounts.low}`;
  doc.text(summaryText, 20, yPos);
}

/**
 * Draw page title
 */
function drawPageTitle(doc: jsPDF, title: string, yPos: number): void {
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 20, yPos);

  // Underline
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(20, yPos + 3, 80, yPos + 3);
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `DORA Comply Board Report | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get percentage string
 */
function getPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
