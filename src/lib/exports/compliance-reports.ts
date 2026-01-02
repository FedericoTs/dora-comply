/**
 * Compliance Report Export Utilities
 *
 * Generates PDF and Excel exports for:
 * - SOC 2 Analysis reports
 * - DORA Compliance mapping reports
 * - Gap analysis reports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Types
interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  confidence: number;
}

interface ParsedException {
  controlId: string;
  controlArea?: string;
  exceptionDescription: string;
  exceptionType?: string;
  managementResponse?: string;
  remediationDate?: string;
  impact: 'low' | 'medium' | 'high';
}

interface ParsedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: 'inclusive' | 'carve_out';
  controlsSupported: string[];
  hasOwnSoc2?: boolean;
}

interface ParsedCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility: string;
  category?: string;
}

interface SOC2ReportData {
  documentName: string;
  vendorName?: string;
  reportType: 'type1' | 'type2';
  auditFirm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  periodStart: string;
  periodEnd: string;
  criteria: string[];
  controls: ParsedControl[];
  exceptions: ParsedException[];
  subserviceOrgs: ParsedSubserviceOrg[];
  cuecs: ParsedCUEC[];
  doraCoverage: {
    overall: number;
    byPillar: {
      ICT_RISK: number;
      INCIDENT: number;
      RESILIENCE: number;
      TPRM: number;
      SHARING: number;
    };
    gaps: string[];
  };
}

// Colors
const COLORS = {
  primary: [224, 122, 95] as [number, number, number], // #E07A5F
  success: [16, 185, 129] as [number, number, number], // #10B981
  warning: [245, 158, 11] as [number, number, number], // #F59E0B
  error: [239, 68, 68] as [number, number, number], // #EF4444
  gray: [107, 114, 128] as [number, number, number], // #6B7280
  dark: [17, 24, 39] as [number, number, number], // #111827
};

/**
 * Generate PDF report for SOC 2 Analysis
 */
export function generateSOC2PDF(data: SOC2ReportData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.dark);
  doc.text('SOC 2 Compliance Analysis Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Report Overview Section
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('Report Overview', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);

  const overviewData = [
    ['Document', data.documentName],
    ['Vendor', data.vendorName || 'N/A'],
    ['Report Type', `SOC 2 Type ${data.reportType === 'type2' ? 'II' : 'I'}`],
    ['Audit Firm', data.auditFirm],
    ['Opinion', data.opinion.charAt(0).toUpperCase() + data.opinion.slice(1)],
    ['Audit Period', `${new Date(data.periodStart).toLocaleDateString()} - ${new Date(data.periodEnd).toLocaleDateString()}`],
    ['Trust Services Criteria', data.criteria.join(', ')],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: overviewData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Executive Summary Section
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('Executive Summary', 14, yPos);
  yPos += 10;

  const totalControls = data.controls.length;
  const effectiveControls = data.controls.filter(c => c.testResult === 'operating_effectively').length;
  const exceptionsCount = data.controls.filter(c => c.testResult === 'exception').length;
  const notTestedCount = data.controls.filter(c => c.testResult === 'not_tested').length;
  const effectivenessRate = totalControls > 0 ? Math.round((effectiveControls / totalControls) * 100) : 0;

  const summaryData = [
    ['Total Controls Tested', totalControls.toString()],
    ['Operating Effectively', `${effectiveControls} (${effectivenessRate}%)`],
    ['With Exceptions', exceptionsCount.toString()],
    ['Not Tested', notTestedCount.toString()],
    ['DORA Overall Coverage', `${data.doraCoverage.overall}%`],
    ['Identified Gaps', data.doraCoverage.gaps.length > 0 ? data.doraCoverage.gaps.join(', ') : 'None'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // DORA Coverage Section
  checkPageBreak(80);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('DORA Compliance Coverage', 14, yPos);
  yPos += 10;

  const pillarLabels: Record<string, string> = {
    ICT_RISK: 'ICT Risk Management',
    INCIDENT: 'Incident Reporting',
    RESILIENCE: 'Resilience Testing',
    TPRM: 'Third-Party Risk Management',
    SHARING: 'Information Sharing',
  };

  const doraData = Object.entries(data.doraCoverage.byPillar).map(([pillar, score]) => {
    const status = score >= 80 ? 'Strong' : score >= 50 ? 'Partial' : 'Gap';
    return [pillarLabels[pillar] || pillar, `${score}%`, status];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['DORA Pillar', 'Coverage', 'Status']],
    body: doraData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 4 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const value = hookData.cell.raw as string;
        if (value === 'Strong') {
          hookData.cell.styles.textColor = COLORS.success;
        } else if (value === 'Partial') {
          hookData.cell.styles.textColor = COLORS.warning;
        } else if (value === 'Gap') {
          hookData.cell.styles.textColor = COLORS.error;
        }
      }
    },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Controls Summary Section
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('Control Test Results', 14, yPos);
  yPos += 10;

  // Group controls by category
  const controlsByCategory: Record<string, ParsedControl[]> = {};
  data.controls.forEach(control => {
    const cat = control.tscCategory || 'Other';
    if (!controlsByCategory[cat]) controlsByCategory[cat] = [];
    controlsByCategory[cat].push(control);
  });

  const categoryData = Object.entries(controlsByCategory).map(([category, controls]) => {
    const effective = controls.filter(c => c.testResult === 'operating_effectively').length;
    return [category, controls.length.toString(), effective.toString(), `${Math.round((effective / controls.length) * 100)}%`];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Total', 'Effective', 'Rate']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Exceptions Section (if any)
  if (data.exceptions.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text('Exceptions', 14, yPos);
    yPos += 10;

    const exceptionData = data.exceptions.map(ex => [
      ex.controlId,
      ex.impact.toUpperCase(),
      ex.exceptionDescription.substring(0, 100) + (ex.exceptionDescription.length > 100 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Control ID', 'Impact', 'Description']],
      body: exceptionData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.error, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto' },
      },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Subservice Organizations Section (if any)
  if (data.subserviceOrgs.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text('Fourth-Party Dependencies', 14, yPos);
    yPos += 10;

    const subserviceData = data.subserviceOrgs.map(org => [
      org.name,
      org.inclusionMethod === 'carve_out' ? 'Carved Out' : 'Inclusive',
      org.hasOwnSoc2 ? 'Yes' : 'No',
      org.serviceDescription.substring(0, 80) + (org.serviceDescription.length > 80 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Organization', 'Method', 'SOC 2', 'Service']],
      body: subserviceData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // CUECs Section (if any)
  if (data.cuecs.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text('Complementary User Entity Controls (CUECs)', 14, yPos);
    yPos += 10;

    const cuecData = data.cuecs.map((cuec, idx) => [
      cuec.id || `CUEC-${idx + 1}`,
      cuec.relatedControl || '-',
      cuec.customerResponsibility.substring(0, 100) + (cuec.customerResponsibility.length > 100 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Related Control', 'Customer Responsibility']],
      body: cuecData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.warning, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `DORA Comply - SOC 2 Analysis Report | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Generate Excel report for SOC 2 Analysis
 */
export function generateSOC2Excel(data: SOC2ReportData): Blob {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['SOC 2 Compliance Analysis Report'],
    ['Generated:', new Date().toLocaleDateString()],
    [],
    ['Report Overview'],
    ['Document', data.documentName],
    ['Vendor', data.vendorName || 'N/A'],
    ['Report Type', `SOC 2 Type ${data.reportType === 'type2' ? 'II' : 'I'}`],
    ['Audit Firm', data.auditFirm],
    ['Opinion', data.opinion],
    ['Period Start', data.periodStart],
    ['Period End', data.periodEnd],
    ['Criteria', data.criteria.join(', ')],
    [],
    ['Executive Summary'],
    ['Total Controls', data.controls.length],
    ['Operating Effectively', data.controls.filter(c => c.testResult === 'operating_effectively').length],
    ['With Exceptions', data.controls.filter(c => c.testResult === 'exception').length],
    ['Not Tested', data.controls.filter(c => c.testResult === 'not_tested').length],
    ['DORA Overall Coverage', `${data.doraCoverage.overall}%`],
    ['Identified Gaps', data.doraCoverage.gaps.join(', ') || 'None'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // DORA Coverage Sheet
  const pillarLabels: Record<string, string> = {
    ICT_RISK: 'ICT Risk Management',
    INCIDENT: 'Incident Reporting',
    RESILIENCE: 'Resilience Testing',
    TPRM: 'Third-Party Risk Management',
    SHARING: 'Information Sharing',
  };

  const doraData = [
    ['DORA Pillar', 'Coverage %', 'Status'],
    ...Object.entries(data.doraCoverage.byPillar).map(([pillar, score]) => [
      pillarLabels[pillar] || pillar,
      score,
      score >= 80 ? 'Strong' : score >= 50 ? 'Partial' : 'Gap',
    ]),
  ];

  const doraSheet = XLSX.utils.aoa_to_sheet(doraData);
  XLSX.utils.book_append_sheet(wb, doraSheet, 'DORA Coverage');

  // Controls Sheet
  const controlsData = [
    ['Control ID', 'Category', 'Area', 'Description', 'Test Result', 'Confidence'],
    ...data.controls.map(c => [
      c.controlId,
      c.tscCategory,
      c.controlArea,
      c.description,
      c.testResult.replace(/_/g, ' '),
      `${Math.round(c.confidence * 100)}%`,
    ]),
  ];

  const controlsSheet = XLSX.utils.aoa_to_sheet(controlsData);
  XLSX.utils.book_append_sheet(wb, controlsSheet, 'Controls');

  // Exceptions Sheet (if any)
  if (data.exceptions.length > 0) {
    const exceptionsData = [
      ['Control ID', 'Control Area', 'Impact', 'Exception Description', 'Management Response', 'Remediation Date'],
      ...data.exceptions.map(ex => [
        ex.controlId,
        ex.controlArea || '',
        ex.impact,
        ex.exceptionDescription,
        ex.managementResponse || '',
        ex.remediationDate || '',
      ]),
    ];

    const exceptionsSheet = XLSX.utils.aoa_to_sheet(exceptionsData);
    XLSX.utils.book_append_sheet(wb, exceptionsSheet, 'Exceptions');
  }

  // Subservice Organizations Sheet (if any)
  if (data.subserviceOrgs.length > 0) {
    const subserviceData = [
      ['Organization Name', 'Service Description', 'Inclusion Method', 'Has Own SOC 2', 'Controls Supported'],
      ...data.subserviceOrgs.map(org => [
        org.name,
        org.serviceDescription,
        org.inclusionMethod,
        org.hasOwnSoc2 ? 'Yes' : 'No',
        org.controlsSupported.join(', '),
      ]),
    ];

    const subserviceSheet = XLSX.utils.aoa_to_sheet(subserviceData);
    XLSX.utils.book_append_sheet(wb, subserviceSheet, 'Fourth Parties');
  }

  // CUECs Sheet (if any)
  if (data.cuecs.length > 0) {
    const cuecsData = [
      ['ID', 'Description', 'Related Control', 'Customer Responsibility', 'Category'],
      ...data.cuecs.map((cuec, idx) => [
        cuec.id || `CUEC-${idx + 1}`,
        cuec.description,
        cuec.relatedControl || '',
        cuec.customerResponsibility,
        cuec.category || '',
      ]),
    ];

    const cuecsSheet = XLSX.utils.aoa_to_sheet(cuecsData);
    XLSX.utils.book_append_sheet(wb, cuecsSheet, 'CUECs');
  }

  // Generate blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export type { SOC2ReportData, ParsedControl, ParsedException, ParsedSubserviceOrg, ParsedCUEC };
