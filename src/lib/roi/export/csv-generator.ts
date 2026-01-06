/**
 * CSV Generator
 *
 * Generates ESA-compliant xBRL-CSV files from template data
 */

import type { RoiTemplateId } from '../types';
import { getColumnOrder } from '../mappings';

// ============================================================================
// CSV Formatting
// ============================================================================

/**
 * Escape a CSV field value according to RFC 4180
 */
function escapeField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format a value for CSV output
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return escapeField(String(value));
}

// ============================================================================
// CSV Generation
// ============================================================================

export interface CsvGeneratorOptions {
  templateId: RoiTemplateId;
  data: Record<string, unknown>[];
  includeHeader?: boolean;
}

export interface CsvGeneratorResult {
  csv: string;
  rowCount: number;
  columnCount: number;
  fileName: string;
}

/**
 * Generate CSV content for a single template
 */
export function generateCsv(options: CsvGeneratorOptions): CsvGeneratorResult {
  const { templateId, data, includeHeader = true } = options;

  // Get column order for this template
  const columns = getColumnOrder(templateId);

  if (columns.length === 0 || data.length === 0) {
    // ESA format: lowercase with dot preserved (e.g., b_01.01.csv)
    const fileName = templateId.toLowerCase() + '.csv';
    return {
      csv: includeHeader ? columns.join(',') + '\n' : '',
      rowCount: 0,
      columnCount: columns.length,
      fileName,
    };
  }

  const lines: string[] = [];

  // Add header row
  if (includeHeader) {
    lines.push(columns.join(','));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map(col => formatValue(row[col]));
    lines.push(values.join(','));
  }

  // ESA requires trailing newline
  const csv = lines.join('\n') + '\n';

  // ESA format: lowercase with dot preserved (e.g., b_01.01.csv)
  const fileName = templateId.toLowerCase() + '.csv';

  return {
    csv,
    rowCount: data.length,
    columnCount: columns.length,
    fileName,
  };
}

// All 15 DORA RoI templates
const ALL_TEMPLATES: RoiTemplateId[] = [
  'B_01.01', 'B_01.02', 'B_01.03',
  'B_02.01', 'B_02.02', 'B_02.03',
  'B_03.01', 'B_03.02', 'B_03.03',
  'B_04.01', 'B_05.01', 'B_05.02',
  'B_06.01', 'B_07.01', 'B_99.01',
];

/**
 * Generate all CSV files for the RoI package
 */
export function generateAllCsvFiles(
  templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>>
): Map<string, CsvGeneratorResult> {
  const results = new Map<string, CsvGeneratorResult>();

  for (const templateId of ALL_TEMPLATES) {
    const data = templateData[templateId] || [];
    const result = generateCsv({ templateId, data });
    results.set(templateId, result);
  }

  return results;
}

// ============================================================================
// CSV Parsing (for importing/validation)
// ============================================================================

/**
 * Parse a CSV string into rows
 */
export function parseCsv(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const value = values[index];
      // Try to parse as boolean
      if (value === 'true') {
        row[header] = true;
      } else if (value === 'false') {
        row[header] = false;
      } else if (value === '') {
        row[header] = null;
      } else if (!isNaN(Number(value)) && value.trim() !== '') {
        row[header] = Number(value);
      } else {
        row[header] = value;
      }
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}
