/**
 * Package Builder
 *
 * Builds the complete xBRL-CSV package for ESA submission
 */

import JSZip from 'jszip';
import type { RoiTemplateId, RoiPackageParameters, RoiExportResult } from '../types';
import { generateCsv } from './csv-generator';
import { generateParametersCsv } from './parameters';

// ============================================================================
// Package Structure (ESA xBRL-CSV format)
// ============================================================================

/**
 * Official ESA Package Structure:
 *
 * {LEI}.CON_FR_DORA010100_DORA_{date}_{timestamp}/
 * ├── META-INF/
 * │   └── reportPackage.json     <- Package metadata
 * └── reports/
 *     ├── report.json            <- Links to EBA taxonomy
 *     ├── parameters.csv         <- Entity, period, currency
 *     ├── FilingIndicators.csv   <- Which templates are reported
 *     ├── b_01.01.csv
 *     ├── b_01.02.csv
 *     └── ... (all template CSVs)
 */

// All 15 DORA RoI templates
const ALL_TEMPLATES: RoiTemplateId[] = [
  'B_01.01', 'B_01.02', 'B_01.03',
  'B_02.01', 'B_02.02', 'B_02.03',
  'B_03.01', 'B_03.02', 'B_03.03',
  'B_04.01', 'B_05.01', 'B_05.02',
  'B_06.01', 'B_07.01', 'B_99.01',
];

// ============================================================================
// META-INF/reportPackage.json Generation
// ============================================================================

function generateReportPackageJson(): string {
  return JSON.stringify({
    documentInfo: {
      documentType: 'https://xbrl.org/report-package/2023',
    },
  }, null, 2);
}

// ============================================================================
// reports/report.json Generation
// ============================================================================

interface ReportJson {
  documentInfo: {
    documentType: string;
    extends: string[];
  };
}

function generateReportJson(): string {
  const report: ReportJson = {
    documentInfo: {
      documentType: 'https://xbrl.org/2021/xbrl-csv',
      extends: [
        'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/dora/4.0/mod/dora.json',
      ],
    },
  };

  return JSON.stringify(report, null, 2);
}

// ============================================================================
// FilingIndicators.csv Generation
// ============================================================================

/**
 * Generate FilingIndicators.csv that declares which templates are reported
 */
function generateFilingIndicatorsCsv(
  templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>>
): string {
  const lines: string[] = ['templateID,reported'];

  for (const templateId of ALL_TEMPLATES) {
    const data = templateData[templateId];
    // Template is "reported" if it has data (even empty array means it was attempted)
    const reported = data !== undefined && data.length > 0;
    lines.push(`${templateId},${reported}`);
  }

  return lines.join('\n') + '\n';
}

// ============================================================================
// Package Building
// ============================================================================

export interface BuildPackageOptions {
  parameters: RoiPackageParameters;
  templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>>;
  timestamp?: Date;
}

export interface PackageFile {
  path: string;
  content: string;
}

/**
 * Build the complete package as a collection of files
 * Uses official ESA folder structure
 */
export function buildPackageFiles(options: BuildPackageOptions): PackageFile[] {
  const { parameters, templateData, timestamp = new Date() } = options;

  const files: PackageFile[] = [];

  // Format timestamp for folder name (YYYYMMDDHHmmssSSS)
  const ts = timestamp.toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 17);

  // Extract LEI from entityId (format: rs:LEI123...)
  const lei = parameters.entityId.replace('rs:', '');

  // Build folder name - ESA format: {LEI}.CON_FR_DORA010100_DORA_{date}_{timestamp}
  const folderName = `${lei}.CON_FR_DORA010100_DORA_${parameters.refPeriod}_${ts}`;
  const reportsPath = `${folderName}/reports`;
  const metaInfPath = `${folderName}/META-INF`;

  // Add META-INF/reportPackage.json
  files.push({
    path: `${metaInfPath}/reportPackage.json`,
    content: generateReportPackageJson(),
  });

  // Add reports/report.json
  files.push({
    path: `${reportsPath}/report.json`,
    content: generateReportJson(),
  });

  // Add reports/parameters.csv
  const paramsCsv = generateParametersCsv(parameters);
  files.push({
    path: `${reportsPath}/parameters.csv`,
    content: paramsCsv,
  });

  // Add reports/FilingIndicators.csv
  files.push({
    path: `${reportsPath}/FilingIndicators.csv`,
    content: generateFilingIndicatorsCsv(templateData),
  });

  // Add template CSV files
  for (const templateId of ALL_TEMPLATES) {
    const data = templateData[templateId] || [];
    const result = generateCsv({ templateId, data });

    files.push({
      path: `${reportsPath}/${result.fileName}`,
      content: result.csv,
    });
  }

  return files;
}

/**
 * Build the complete package as a ZIP file
 * Uses Uint8Array for cross-platform compatibility (Node.js + Vercel Edge)
 */
export async function buildPackageZip(
  options: BuildPackageOptions
): Promise<{ buffer: Buffer; fileName: string }> {
  const files = buildPackageFiles(options);

  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Use uint8array for cross-platform compatibility, then convert to Buffer
  const uint8Array = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Convert Uint8Array to Buffer for Node.js compatibility
  const buffer = Buffer.from(uint8Array);

  // Extract folder name from first file path
  const folderName = files[0].path.split('/')[0];
  const fileName = `${folderName}.zip`;

  return { buffer, fileName };
}

/**
 * Build package and return result with metadata
 */
export async function buildRoiPackage(
  options: BuildPackageOptions
): Promise<RoiExportResult> {
  const { templateData, timestamp = new Date() } = options;

  try {
    buildPackageFiles(options);

    // Count rows per template
    const templateFiles = ALL_TEMPLATES.map(templateId => {
      const data = templateData[templateId] || [];
      // ESA format uses lowercase with dot: b_01.01.csv
      const fileName = templateId.toLowerCase() + '.csv';
      return {
        templateId,
        fileName,
        rowCount: data.length,
      };
    });

    return {
      success: true,
      templateFiles,
      metadata: {
        generatedAt: timestamp.toISOString(),
        generatedBy: 'DORA Comply RoI Engine v1.0',
        version: '4.0', // ESA DORA version
      },
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      templateFiles: [],
      metadata: {
        generatedAt: timestamp.toISOString(),
        generatedBy: 'DORA Comply RoI Engine v1.0',
        version: '4.0',
      },
    };
  }
}

// ============================================================================
// Streaming Export (for large datasets)
// ============================================================================

export interface StreamingExportOptions extends BuildPackageOptions {
  onProgress?: (templateId: RoiTemplateId, progress: number) => void;
}

/**
 * Build package with progress updates for large datasets
 */
export async function buildPackageWithProgress(
  options: StreamingExportOptions
): Promise<{ buffer: Buffer; fileName: string }> {
  const { parameters, templateData, timestamp = new Date(), onProgress } = options;

  const zip = new JSZip();

  // Format timestamp
  const ts = timestamp.toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 17);

  const lei = parameters.entityId.replace('rs:', '');
  // ESA format: {LEI}.CON_FR_DORA010100_DORA_{date}_{timestamp}
  const folderName = `${lei}.CON_FR_DORA010100_DORA_${parameters.refPeriod}_${ts}`;
  const reportsPath = `${folderName}/reports`;
  const metaInfPath = `${folderName}/META-INF`;

  // Add META-INF/reportPackage.json
  zip.file(`${metaInfPath}/reportPackage.json`, generateReportPackageJson());

  // Add static files in reports/
  zip.file(`${reportsPath}/report.json`, generateReportJson());
  zip.file(`${reportsPath}/parameters.csv`, generateParametersCsv(parameters));
  zip.file(`${reportsPath}/FilingIndicators.csv`, generateFilingIndicatorsCsv(templateData));

  // Add template files with progress
  for (let i = 0; i < ALL_TEMPLATES.length; i++) {
    const templateId = ALL_TEMPLATES[i];
    const data = templateData[templateId] || [];
    const result = generateCsv({ templateId, data });

    zip.file(`${reportsPath}/${result.fileName}`, result.csv);

    if (onProgress) {
      onProgress(templateId, ((i + 1) / ALL_TEMPLATES.length) * 100);
    }
  }

  // Use uint8array for cross-platform compatibility, then convert to Buffer
  const uint8Array = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const buffer = Buffer.from(uint8Array);

  return { buffer, fileName: `${folderName}.zip` };
}
