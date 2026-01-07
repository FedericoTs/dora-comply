/**
 * Board Report PowerPoint Generator
 *
 * Generates executive-level PPTX presentations for board meetings.
 * 8 slides: Cover, Executive Summary, DORA Maturity, Critical Gaps,
 * Concentration Risk, Vendor Portfolio, Action Items, Appendix.
 */

import pptxgen from 'pptxgenjs';
import type { BoardReportData } from './board-report-types';
import { MATURITY_LABELS, PILLAR_LABELS } from './board-report-types';

// PPTX Color format (hex without #)
const PPTX_COLORS = {
  primary: 'E07A5F',
  success: '10B981',
  warning: 'F59E0B',
  error: 'EF4444',
  info: '3B82F6',
  gray: '6B7280',
  dark: '111827',
  white: 'FFFFFF',
  lightGray: 'F3F4F6',
};

// Helper to create a text cell
function cell(
  text: string,
  options?: pptxgen.TextPropsOptions
): pptxgen.TableCell {
  return { text, options };
}

// Helper to create a header cell
function headerCell(
  text: string,
  fillColor: string = PPTX_COLORS.primary
): pptxgen.TableCell {
  return {
    text,
    options: {
      bold: true,
      fill: { color: fillColor },
      color: PPTX_COLORS.white,
    },
  };
}

/**
 * Generate PowerPoint board report
 */
export async function generateBoardReportPPTX(
  data: BoardReportData
): Promise<Blob> {
  const pptx = new pptxgen();

  // Set presentation metadata
  pptx.author = 'DORA Comply';
  pptx.title = `Board Report - ${data.organization.name}`;
  pptx.subject = 'DORA Compliance Board Report';
  pptx.company = data.organization.name;

  // Define master slide layout
  pptx.defineSlideMaster({
    title: 'DORA_MASTER',
    background: { color: PPTX_COLORS.white },
    objects: [
      {
        line: {
          x: 0.5,
          y: 5.3,
          w: 9,
          h: 0,
          line: { color: PPTX_COLORS.lightGray, width: 1 },
        },
      },
      {
        text: {
          text: 'DORA Comply | Confidential',
          options: {
            x: 0.5,
            y: 5.4,
            w: 5,
            h: 0.3,
            fontSize: 8,
            color: PPTX_COLORS.gray,
          },
        },
      },
    ],
    slideNumber: { x: 9.0, y: 5.4, fontSize: 8, color: PPTX_COLORS.gray },
  });

  // Create all slides
  createCoverSlide(pptx, data);
  createExecutiveSummarySlide(pptx, data);
  createDORAMaturitySlide(pptx, data);
  createCriticalGapsSlide(pptx, data);
  createConcentrationRiskSlide(pptx, data);
  createVendorPortfolioSlide(pptx, data);
  createActionItemsSlide(pptx, data);
  createAppendixSlide(pptx, data);

  // Generate blob
  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
}

/**
 * Create cover slide
 */
function createCoverSlide(pptx: pptxgen, data: BoardReportData): void {
  const slide = pptx.addSlide();

  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 2.5,
    fill: { color: PPTX_COLORS.primary },
  });

  slide.addText('DORA Compliance', {
    x: 0.5,
    y: 0.6,
    w: 9,
    h: 0.8,
    fontSize: 40,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.white,
  });

  slide.addText('Board Report', {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    fontFace: 'Arial',
    color: PPTX_COLORS.white,
  });

  slide.addText(data.organization.name, {
    x: 0.5,
    y: 2.8,
    w: 9,
    h: 0.5,
    fontSize: 24,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  slide.addText(
    `Reporting Period: ${formatDate(data.reportingPeriod.from)} - ${formatDate(data.reportingPeriod.to)}`,
    {
      x: 0.5,
      y: 3.3,
      w: 9,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      color: PPTX_COLORS.gray,
    }
  );

  // Key metrics boxes
  const metrics = [
    {
      label: 'Compliance Score',
      value: `${data.executiveSummary.overallComplianceScore}%`,
    },
    { label: 'Maturity Level', value: data.executiveSummary.doraMaturityLevel },
    {
      label: 'Critical Vendors',
      value: data.executiveSummary.criticalVendors.toString(),
    },
    {
      label: 'Open Incidents',
      value: data.executiveSummary.openIncidents.toString(),
    },
  ];

  const boxWidth = 2.2;
  const startX = 0.5;
  const boxY = 4.2;

  metrics.forEach((metric, idx) => {
    const x = startX + idx * (boxWidth + 0.15);

    slide.addShape('rect', {
      x,
      y: boxY,
      w: boxWidth,
      h: 0.9,
      fill: { color: PPTX_COLORS.lightGray },
    });

    slide.addText(metric.value, {
      x,
      y: boxY + 0.1,
      w: boxWidth,
      h: 0.5,
      fontSize: 24,
      fontFace: 'Arial',
      bold: true,
      color: PPTX_COLORS.primary,
      align: 'center',
    });

    slide.addText(metric.label, {
      x,
      y: boxY + 0.55,
      w: boxWidth,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: PPTX_COLORS.gray,
      align: 'center',
    });
  });
}

/**
 * Create executive summary slide
 */
function createExecutiveSummarySlide(
  pptx: pptxgen,
  data: BoardReportData
): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Executive Summary');

  const score = data.executiveSummary.overallComplianceScore;
  const scoreColor =
    score >= 75
      ? PPTX_COLORS.success
      : score >= 50
        ? PPTX_COLORS.warning
        : PPTX_COLORS.error;

  slide.addText(`${score}%`, {
    x: 0.5,
    y: 1.0,
    w: 2,
    h: 1,
    fontSize: 56,
    fontFace: 'Arial',
    bold: true,
    color: scoreColor,
  });

  slide.addText(
    `Maturity: ${data.executiveSummary.doraMaturityLevel} (${MATURITY_LABELS[data.executiveSummary.doraMaturityLevel]})`,
    {
      x: 0.5,
      y: 2.0,
      w: 3,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      color: PPTX_COLORS.gray,
    }
  );

  // Key metrics table
  const metricsTable: pptxgen.TableRow[] = [
    [headerCell('Metric'), headerCell('Value')],
    [
      cell('Critical Vendors'),
      cell(data.executiveSummary.criticalVendors.toString()),
    ],
    [
      cell('High Risk Vendors'),
      cell(data.executiveSummary.highRiskVendors.toString()),
    ],
    [
      cell('Open Incidents'),
      cell(data.executiveSummary.openIncidents.toString()),
    ],
    [cell('Total Vendors'), cell(data.vendorSummary.total.toString())],
    [
      cell('Pending Assessments'),
      cell(data.vendorSummary.pendingAssessments.toString()),
    ],
  ];

  slide.addTable(metricsTable, {
    x: 3.5,
    y: 1.0,
    w: 3,
    colW: [2, 1],
    fontSize: 11,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  // Key Risks
  slide.addText('Key Risks', {
    x: 0.5,
    y: 2.5,
    w: 3,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  const risksText =
    data.executiveSummary.keyRisks.length > 0
      ? data.executiveSummary.keyRisks.map((r) => `• ${r}`).join('\n')
      : '• No critical risks identified';

  slide.addText(risksText, {
    x: 0.5,
    y: 2.9,
    w: 4,
    h: 1.2,
    fontSize: 11,
    fontFace: 'Arial',
    color: PPTX_COLORS.error,
    valign: 'top',
  });

  // Recommendations
  slide.addText('Recommendations', {
    x: 5,
    y: 2.5,
    w: 4,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  const recsText =
    data.executiveSummary.recommendations.length > 0
      ? data.executiveSummary.recommendations
          .map((r, i) => `${i + 1}. ${r}`)
          .join('\n')
      : '1. Continue current trajectory';

  slide.addText(recsText, {
    x: 5,
    y: 2.9,
    w: 4.5,
    h: 1.2,
    fontSize: 11,
    fontFace: 'Arial',
    color: PPTX_COLORS.dark,
    valign: 'top',
  });
}

/**
 * Create DORA maturity slide
 */
function createDORAMaturitySlide(pptx: pptxgen, data: BoardReportData): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'DORA Compliance by Pillar');

  const pillarRows: pptxgen.TableRow[] = [
    [
      headerCell('DORA Pillar'),
      headerCell('Coverage'),
      headerCell('Controls'),
      headerCell('Status'),
    ],
  ];

  data.doraCompliance.pillars.forEach((pillar) => {
    const statusColor =
      pillar.status === 'compliant'
        ? PPTX_COLORS.success
        : pillar.status === 'partial'
          ? PPTX_COLORS.warning
          : PPTX_COLORS.error;

    pillarRows.push([
      cell(PILLAR_LABELS[pillar.code] || pillar.name),
      cell(`${pillar.coverage}%`),
      cell(`${pillar.controlsImplemented}/${pillar.controlsTotal}`),
      cell(pillar.status.toUpperCase(), { color: statusColor, bold: true }),
    ]);
  });

  slide.addTable(pillarRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [3.5, 1.5, 1.5, 2.5],
    fontSize: 12,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  const avgCoverage = Math.round(
    data.doraCompliance.pillars.reduce((sum, p) => sum + p.coverage, 0) /
      data.doraCompliance.pillars.length
  );

  slide.addText(`Average Pillar Coverage: ${avgCoverage}%`, {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.primary,
  });
}

/**
 * Create critical gaps slide
 */
function createCriticalGapsSlide(pptx: pptxgen, data: BoardReportData): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Critical Compliance Gaps');

  if (data.doraCompliance.criticalGaps.length === 0) {
    slide.addText('No critical compliance gaps identified', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 0.5,
      fontSize: 18,
      fontFace: 'Arial',
      color: PPTX_COLORS.success,
      align: 'center',
    });
    return;
  }

  const gapRows: pptxgen.TableRow[] = [
    [
      headerCell('Pillar', PPTX_COLORS.error),
      headerCell('Gap', PPTX_COLORS.error),
      headerCell('Priority', PPTX_COLORS.error),
      headerCell('Remediation', PPTX_COLORS.error),
    ],
  ];

  data.doraCompliance.criticalGaps.forEach((gap) => {
    const priorityColor =
      gap.priority === 'critical'
        ? PPTX_COLORS.error
        : gap.priority === 'high'
          ? PPTX_COLORS.warning
          : PPTX_COLORS.info;

    gapRows.push([
      cell(PILLAR_LABELS[gap.pillar] || gap.pillar),
      cell(gap.gap),
      cell(gap.priority.toUpperCase(), { color: priorityColor, bold: true }),
      cell(gap.remediationSuggestion || '-'),
    ]);
  });

  slide.addTable(gapRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [2, 2.5, 1, 3.5],
    fontSize: 10,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });
}

/**
 * Create concentration risk slide
 */
function createConcentrationRiskSlide(
  pptx: pptxgen,
  data: BoardReportData
): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Concentration Risk Analysis');

  const hhiColor =
    data.concentrationRisk.hhiCategory === 'low'
      ? PPTX_COLORS.success
      : data.concentrationRisk.hhiCategory === 'moderate'
        ? PPTX_COLORS.warning
        : PPTX_COLORS.error;

  slide.addText('HHI Score', {
    x: 0.5,
    y: 1.0,
    w: 2,
    h: 0.3,
    fontSize: 12,
    fontFace: 'Arial',
    color: PPTX_COLORS.gray,
  });

  slide.addText(data.concentrationRisk.hhiScore.toLocaleString(), {
    x: 0.5,
    y: 1.25,
    w: 2,
    h: 0.6,
    fontSize: 36,
    fontFace: 'Arial',
    bold: true,
    color: hhiColor,
  });

  slide.addText(data.concentrationRisk.hhiCategory.toUpperCase(), {
    x: 0.5,
    y: 1.85,
    w: 2,
    h: 0.3,
    fontSize: 11,
    fontFace: 'Arial',
    bold: true,
    color: hhiColor,
  });

  slide.addText(`SPOFs: ${data.concentrationRisk.spofsCount}`, {
    x: 3,
    y: 1.2,
    w: 2,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  slide.addText(
    `Chain Depth: ${data.concentrationRisk.fourthPartyDepth} levels`,
    {
      x: 5.5,
      y: 1.2,
      w: 2.5,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      bold: true,
      color: PPTX_COLORS.dark,
    }
  );

  // Geographic breakdown table
  const geoRows: pptxgen.TableRow[] = [
    [
      headerCell('Region/Country'),
      headerCell('Share'),
      headerCell('Vendors'),
      headerCell('Risk'),
    ],
  ];

  data.concentrationRisk.geographicBreakdown.forEach((geo) => {
    const riskColor =
      geo.riskLevel === 'high'
        ? PPTX_COLORS.error
        : geo.riskLevel === 'medium'
          ? PPTX_COLORS.warning
          : PPTX_COLORS.success;

    geoRows.push([
      cell(geo.country || geo.region),
      cell(`${geo.percentage}%`),
      cell(geo.vendorCount.toString()),
      cell(geo.riskLevel.toUpperCase(), { color: riskColor, bold: true }),
    ]);
  });

  slide.addTable(geoRows, {
    x: 0.5,
    y: 2.4,
    w: 6,
    colW: [2.5, 1, 1, 1.5],
    fontSize: 11,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  // Top risks
  if (data.concentrationRisk.topRisks.length > 0) {
    slide.addText('Top Risks:', {
      x: 7,
      y: 2.4,
      w: 2.5,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: PPTX_COLORS.error,
    });

    const risksText = data.concentrationRisk.topRisks
      .map((r) => `• ${r}`)
      .join('\n');
    slide.addText(risksText, {
      x: 7,
      y: 2.8,
      w: 2.5,
      h: 2,
      fontSize: 10,
      fontFace: 'Arial',
      color: PPTX_COLORS.dark,
      valign: 'top',
    });
  }
}

/**
 * Create vendor portfolio slide
 */
function createVendorPortfolioSlide(
  pptx: pptxgen,
  data: BoardReportData
): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Vendor Portfolio Summary');

  slide.addText(data.vendorSummary.total.toString(), {
    x: 0.5,
    y: 1.0,
    w: 2,
    h: 0.8,
    fontSize: 48,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.primary,
  });

  slide.addText('Total Vendors', {
    x: 0.5,
    y: 1.8,
    w: 2,
    h: 0.3,
    fontSize: 14,
    fontFace: 'Arial',
    color: PPTX_COLORS.gray,
  });

  // By Tier table
  const tierRows: pptxgen.TableRow[] = [
    [headerCell('Tier'), headerCell('Count'), headerCell('%')],
    [
      cell('Critical'),
      cell(data.vendorSummary.byTier.critical.toString()),
      cell(
        getPercentage(
          data.vendorSummary.byTier.critical,
          data.vendorSummary.total
        )
      ),
    ],
    [
      cell('Important'),
      cell(data.vendorSummary.byTier.important.toString()),
      cell(
        getPercentage(
          data.vendorSummary.byTier.important,
          data.vendorSummary.total
        )
      ),
    ],
    [
      cell('Standard'),
      cell(data.vendorSummary.byTier.standard.toString()),
      cell(
        getPercentage(
          data.vendorSummary.byTier.standard,
          data.vendorSummary.total
        )
      ),
    ],
  ];

  slide.addText('By Criticality Tier', {
    x: 3,
    y: 1.0,
    w: 3,
    h: 0.3,
    fontSize: 12,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  slide.addTable(tierRows, {
    x: 3,
    y: 1.3,
    w: 3,
    colW: [1.2, 0.9, 0.9],
    fontSize: 11,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  // By Risk table
  const riskRows: pptxgen.TableRow[] = [
    [
      headerCell('Risk', PPTX_COLORS.warning),
      headerCell('Count', PPTX_COLORS.warning),
      headerCell('%', PPTX_COLORS.warning),
    ],
    [
      cell('Critical', { color: PPTX_COLORS.error }),
      cell(data.vendorSummary.byRisk.critical.toString()),
      cell(
        getPercentage(
          data.vendorSummary.byRisk.critical,
          data.vendorSummary.total
        )
      ),
    ],
    [
      cell('High', { color: PPTX_COLORS.warning }),
      cell(data.vendorSummary.byRisk.high.toString()),
      cell(
        getPercentage(data.vendorSummary.byRisk.high, data.vendorSummary.total)
      ),
    ],
    [
      cell('Medium'),
      cell(data.vendorSummary.byRisk.medium.toString()),
      cell(
        getPercentage(
          data.vendorSummary.byRisk.medium,
          data.vendorSummary.total
        )
      ),
    ],
    [
      cell('Low'),
      cell(data.vendorSummary.byRisk.low.toString()),
      cell(
        getPercentage(data.vendorSummary.byRisk.low, data.vendorSummary.total)
      ),
    ],
  ];

  slide.addText('By Risk Level', {
    x: 6.5,
    y: 1.0,
    w: 3,
    h: 0.3,
    fontSize: 12,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  slide.addTable(riskRows, {
    x: 6.5,
    y: 1.3,
    w: 3,
    colW: [1.2, 0.9, 0.9],
    fontSize: 11,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  // Attention required
  slide.addText('Attention Required', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.dark,
  });

  const alertsText = [
    `• Pending Assessments: ${data.vendorSummary.pendingAssessments}`,
    `• Contracts Expiring (30 days): ${data.vendorSummary.contractsExpiringIn30Days}`,
    `• Contracts Expiring (90 days): ${data.vendorSummary.expiringContracts}`,
  ].join('\n');

  slide.addText(alertsText, {
    x: 0.5,
    y: 3.9,
    w: 9,
    h: 1,
    fontSize: 12,
    fontFace: 'Arial',
    color: PPTX_COLORS.dark,
  });
}

/**
 * Create action items slide
 */
function createActionItemsSlide(pptx: pptxgen, data: BoardReportData): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Priority Action Items');

  if (data.actionItems.length === 0) {
    slide.addText('No outstanding action items', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 0.5,
      fontSize: 18,
      fontFace: 'Arial',
      color: PPTX_COLORS.success,
      align: 'center',
    });
    return;
  }

  const actionRows: pptxgen.TableRow[] = [
    [
      headerCell('ID'),
      headerCell('Action'),
      headerCell('Priority'),
      headerCell('Category'),
    ],
  ];

  // Show top 8 action items
  data.actionItems.slice(0, 8).forEach((item) => {
    const priorityColor =
      item.priority === 'critical'
        ? PPTX_COLORS.error
        : item.priority === 'high'
          ? PPTX_COLORS.warning
          : item.priority === 'medium'
            ? PPTX_COLORS.info
            : PPTX_COLORS.gray;

    actionRows.push([
      cell(item.id),
      cell(item.title),
      cell(item.priority.toUpperCase(), { color: priorityColor, bold: true }),
      cell(item.category.charAt(0).toUpperCase() + item.category.slice(1)),
    ]);
  });

  slide.addTable(actionRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [1.2, 4.3, 1.5, 2],
    fontSize: 10,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  // Summary
  const priorityCounts = {
    critical: data.actionItems.filter((i) => i.priority === 'critical').length,
    high: data.actionItems.filter((i) => i.priority === 'high').length,
    medium: data.actionItems.filter((i) => i.priority === 'medium').length,
    low: data.actionItems.filter((i) => i.priority === 'low').length,
  };

  slide.addText(
    `Summary: Critical: ${priorityCounts.critical} | High: ${priorityCounts.high} | Medium: ${priorityCounts.medium} | Low: ${priorityCounts.low}`,
    {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: PPTX_COLORS.dark,
    }
  );
}

/**
 * Create appendix slide
 */
function createAppendixSlide(pptx: pptxgen, data: BoardReportData): void {
  const slide = pptx.addSlide({ masterName: 'DORA_MASTER' });

  addSlideTitle(slide, 'Appendix: Detailed Metrics');

  const metricsRows: pptxgen.TableRow[] = [
    [
      headerCell('Category', PPTX_COLORS.gray),
      headerCell('Metric', PPTX_COLORS.gray),
      headerCell('Value', PPTX_COLORS.gray),
    ],
    [
      cell('Compliance'),
      cell('Overall Score'),
      cell(`${data.executiveSummary.overallComplianceScore}%`),
    ],
    [
      cell('Compliance'),
      cell('Maturity Level'),
      cell(
        `${data.executiveSummary.doraMaturityLevel} (${MATURITY_LABELS[data.executiveSummary.doraMaturityLevel]})`
      ),
    ],
    [
      cell('Vendors'),
      cell('Total Count'),
      cell(data.vendorSummary.total.toString()),
    ],
    [
      cell('Vendors'),
      cell('Critical Tier'),
      cell(data.vendorSummary.byTier.critical.toString()),
    ],
    [
      cell('Vendors'),
      cell('High Risk'),
      cell(
        (
          data.vendorSummary.byRisk.critical + data.vendorSummary.byRisk.high
        ).toString()
      ),
    ],
    [
      cell('Concentration'),
      cell('HHI Score'),
      cell(data.concentrationRisk.hhiScore.toLocaleString()),
    ],
    [
      cell('Concentration'),
      cell('SPOFs'),
      cell(data.concentrationRisk.spofsCount.toString()),
    ],
    [
      cell('Concentration'),
      cell('Geographic Regions'),
      cell(data.concentrationRisk.geographicBreakdown.length.toString()),
    ],
    [
      cell('Operations'),
      cell('Open Incidents'),
      cell(data.executiveSummary.openIncidents.toString()),
    ],
    [
      cell('Operations'),
      cell('Pending Assessments'),
      cell(data.vendorSummary.pendingAssessments.toString()),
    ],
    [
      cell('Operations'),
      cell('Expiring Contracts'),
      cell(data.vendorSummary.expiringContracts.toString()),
    ],
    [cell('Actions'), cell('Total Items'), cell(data.actionItems.length.toString())],
    [
      cell('Actions'),
      cell('Critical Priority'),
      cell(
        data.actionItems.filter((i) => i.priority === 'critical').length.toString()
      ),
    ],
  ];

  slide.addTable(metricsRows, {
    x: 0.5,
    y: 1.0,
    w: 9,
    colW: [2, 4, 3],
    fontSize: 10,
    fontFace: 'Arial',
    border: { type: 'solid', pt: 0.5, color: PPTX_COLORS.lightGray },
  });

  slide.addText(`Report Generated: ${formatDate(data.generatedAt)}`, {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    color: PPTX_COLORS.gray,
  });
}

/**
 * Add slide title
 */
function addSlideTitle(slide: pptxgen.Slide, title: string): void {
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    fontFace: 'Arial',
    bold: true,
    color: PPTX_COLORS.primary,
  });

  slide.addShape('line', {
    x: 0.5,
    y: 0.85,
    w: 2,
    h: 0,
    line: { color: PPTX_COLORS.primary, width: 2 },
  });
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
