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
// Package Structure
// ============================================================================

/**
 * ESA Package Structure:
 *
 * {LEI}.CON_FR_DORA010100_DORA_{date}_{timestamp}/
 * ├── META-INF/
 * │   └── reports/
 * │       ├── parameters.csv
 * │       ├── report.json
 * │       ├── b_01.01.csv
 * │       ├── b_01.02.csv
 * │       └── ... (all template CSVs)
 */

// ============================================================================
// Report.json Generation
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

  // Build folder name
  const folderName = `${lei}_FR_DORA010100_DORA_${parameters.refPeriod}_${ts}`;
  const basePath = `${folderName}/META-INF/reports`;

  // Add parameters.csv
  const paramsCsv = generateParametersCsv(parameters);
  files.push({
    path: `${basePath}/parameters.csv`,
    content: paramsCsv,
  });

  // Add report.json
  files.push({
    path: `${basePath}/report.json`,
    content: generateReportJson(),
  });

  // Add template CSV files
  const templates: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01',
  ];

  for (const templateId of templates) {
    const data = templateData[templateId] || [];
    const result = generateCsv({ templateId, data });

    files.push({
      path: `${basePath}/${result.fileName}`,
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
  const { parameters, templateData, timestamp = new Date() } = options;

  try {
    const files = buildPackageFiles(options);

    // Count rows per template
    const templates: RoiTemplateId[] = [
      'B_01.01', 'B_01.02', 'B_01.03',
      'B_02.01', 'B_02.02', 'B_02.03',
      'B_03.01', 'B_03.02', 'B_03.03',
      'B_04.01', 'B_05.01', 'B_05.02',
      'B_06.01', 'B_07.01',
    ];

    const templateFiles = templates.map(templateId => {
      const data = templateData[templateId] || [];
      const fileName = templateId.toLowerCase().replace('.', '_') + '.csv';
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
  const folderName = `${lei}_FR_DORA010100_DORA_${parameters.refPeriod}_${ts}`;
  const basePath = `${folderName}/META-INF/reports`;

  // Add static files first
  zip.file(`${basePath}/parameters.csv`, generateParametersCsv(parameters));
  zip.file(`${basePath}/report.json`, generateReportJson());

  // Add template files with progress
  const templates: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01',
  ];

  for (let i = 0; i < templates.length; i++) {
    const templateId = templates[i];
    const data = templateData[templateId] || [];
    const result = generateCsv({ templateId, data });

    zip.file(`${basePath}/${result.fileName}`, result.csv);

    if (onProgress) {
      onProgress(templateId, ((i + 1) / templates.length) * 100);
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
