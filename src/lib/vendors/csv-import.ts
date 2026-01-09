/**
 * CSV Import Utilities for Vendor Bulk Import
 *
 * Handles CSV parsing, validation, and mapping for vendor imports.
 */

import { z } from 'zod';
import { bulkImportRowSchema, type BulkImportRow } from './schemas';
import type { VendorTier, ProviderType, ServiceType } from './types';

// ============================================================================
// Types
// ============================================================================

export interface CSVColumn {
  index: number;
  header: string;
  sampleValues: string[];
}

export interface ColumnMapping {
  csvColumn: string;
  vendorField: VendorImportField | null;
  required: boolean;
}

export type VendorImportField =
  | 'name'
  | 'lei'
  | 'tier'
  | 'provider_type'
  | 'headquarters_country'
  | 'service_types'
  | 'supports_critical_function'
  | 'contact_name'
  | 'contact_email'
  | 'notes';

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  columns: CSVColumn[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ValidatedImportRow {
  rowIndex: number;
  data: BulkImportRow;
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ValidatedImportRow[];
  duplicateLEIs: string[];
  duplicateNames: string[];
}

// ============================================================================
// Field Metadata
// ============================================================================

export const VENDOR_IMPORT_FIELDS: Record<VendorImportField, {
  label: string;
  description: string;
  required: boolean;
  example: string;
}> = {
  name: {
    label: 'Vendor Name',
    description: 'Legal name of the vendor',
    required: true,
    example: 'Amazon Web Services',
  },
  lei: {
    label: 'LEI',
    description: 'Legal Entity Identifier (20 characters)',
    required: false,
    example: 'LMZJJFXS8HW3LQN52T82',
  },
  tier: {
    label: 'Tier',
    description: 'Criticality tier (critical, important, standard)',
    required: false,
    example: 'critical',
  },
  provider_type: {
    label: 'Provider Type',
    description: 'Type of ICT provider',
    required: false,
    example: 'cloud_service_provider',
  },
  headquarters_country: {
    label: 'Headquarters Country',
    description: 'ISO 3166-1 alpha-2 country code',
    required: false,
    example: 'US',
  },
  service_types: {
    label: 'Service Types',
    description: 'Comma-separated list of services',
    required: false,
    example: 'cloud_computing, infrastructure_as_service',
  },
  supports_critical_function: {
    label: 'Supports Critical Function',
    description: 'Whether vendor supports critical functions (true/false)',
    required: false,
    example: 'true',
  },
  contact_name: {
    label: 'Contact Name',
    description: 'Primary contact name',
    required: false,
    example: 'John Smith',
  },
  contact_email: {
    label: 'Contact Email',
    description: 'Primary contact email',
    required: false,
    example: 'john.smith@example.com',
  },
  notes: {
    label: 'Notes',
    description: 'Additional notes about the vendor',
    required: false,
    example: 'Main cloud provider for EU region',
  },
};

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse CSV string into structured data
 */
export function parseCSV(csvContent: string): ParsedCSV {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0) {
    throw new Error('No headers found in CSV');
  }

  // Parse data rows
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length > 0 && row.some(cell => cell.trim())) {
      // Ensure row has same number of columns as headers
      while (row.length < headers.length) {
        row.push('');
      }
      rows.push(row.slice(0, headers.length));
    }
  }

  // Build column info with samples
  const columns: CSVColumn[] = headers.map((header, index) => ({
    index,
    header: header.trim(),
    sampleValues: rows.slice(0, 3).map(row => row[index]?.trim() || ''),
  }));

  return { headers, rows, columns };
}

/**
 * Parse a single CSV line handling quoted fields
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
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

// ============================================================================
// Auto-Mapping
// ============================================================================

/**
 * Automatically map CSV columns to vendor fields based on header names
 */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  // Normalized header patterns to field mappings
  const patterns: Record<string, VendorImportField> = {
    name: 'name',
    vendor: 'name',
    'vendor name': 'name',
    'company name': 'name',
    company: 'name',
    'legal name': 'name',
    lei: 'lei',
    'lei code': 'lei',
    'legal entity identifier': 'lei',
    tier: 'tier',
    criticality: 'tier',
    'vendor tier': 'tier',
    'provider type': 'provider_type',
    'provider_type': 'provider_type',
    type: 'provider_type',
    country: 'headquarters_country',
    'headquarters country': 'headquarters_country',
    'headquarters_country': 'headquarters_country',
    hq: 'headquarters_country',
    'hq country': 'headquarters_country',
    location: 'headquarters_country',
    services: 'service_types',
    'service types': 'service_types',
    'service_types': 'service_types',
    critical: 'supports_critical_function',
    'critical function': 'supports_critical_function',
    'supports critical': 'supports_critical_function',
    'supports_critical_function': 'supports_critical_function',
    contact: 'contact_name',
    'contact name': 'contact_name',
    'contact_name': 'contact_name',
    'primary contact': 'contact_name',
    email: 'contact_email',
    'contact email': 'contact_email',
    'contact_email': 'contact_email',
    notes: 'notes',
    description: 'notes',
    comments: 'notes',
  };

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const vendorField = patterns[normalized] || null;
    const fieldMeta = vendorField ? VENDOR_IMPORT_FIELDS[vendorField] : null;

    mappings.push({
      csvColumn: header,
      vendorField,
      required: fieldMeta?.required || false,
    });
  }

  return mappings;
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform a raw CSV row into a validated import row
 */
export function transformRow(
  row: string[],
  mappings: ColumnMapping[],
  rowIndex: number
): ValidatedImportRow {
  const data: Record<string, unknown> = {};
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Extract mapped values
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    if (!mapping.vendorField) continue;

    const rawValue = row[i]?.trim() || '';
    const field = mapping.vendorField;

    // Transform value based on field type
    switch (field) {
      case 'name':
        if (!rawValue) {
          errors.push({
            row: rowIndex,
            field: 'name',
            message: 'Vendor name is required',
            value: rawValue,
          });
        }
        data.name = rawValue;
        break;

      case 'lei':
        if (rawValue) {
          const upperLEI = rawValue.toUpperCase().replace(/\s/g, '');
          if (upperLEI.length !== 20) {
            errors.push({
              row: rowIndex,
              field: 'lei',
              message: 'LEI must be exactly 20 characters',
              value: rawValue,
            });
          } else if (!/^[A-Z0-9]+$/.test(upperLEI)) {
            errors.push({
              row: rowIndex,
              field: 'lei',
              message: 'LEI must contain only alphanumeric characters',
              value: rawValue,
            });
          }
          data.lei = upperLEI;
        }
        break;

      case 'tier':
        if (rawValue) {
          const normalizedTier = rawValue.toLowerCase();
          if (!['critical', 'important', 'standard'].includes(normalizedTier)) {
            warnings.push(`Unknown tier "${rawValue}", defaulting to "standard"`);
            data.tier = 'standard';
          } else {
            data.tier = normalizedTier as VendorTier;
          }
        }
        break;

      case 'provider_type':
        if (rawValue) {
          const normalizedType = rawValue.toLowerCase().replace(/\s+/g, '_');
          const validTypes = ['ict_service_provider', 'cloud_service_provider', 'data_centre', 'network_provider', 'other'];
          if (!validTypes.includes(normalizedType)) {
            warnings.push(`Unknown provider type "${rawValue}", defaulting to "other"`);
            data.provider_type = 'other';
          } else {
            data.provider_type = normalizedType as ProviderType;
          }
        }
        break;

      case 'headquarters_country':
        if (rawValue) {
          const upperCountry = rawValue.toUpperCase();
          if (upperCountry.length !== 2) {
            errors.push({
              row: rowIndex,
              field: 'headquarters_country',
              message: 'Country code must be 2 characters (ISO 3166-1 alpha-2)',
              value: rawValue,
            });
          }
          data.headquarters_country = upperCountry;
        }
        break;

      case 'service_types':
        if (rawValue) {
          // Keep as comma-separated string, will be parsed by schema
          data.service_types = rawValue;
        }
        break;

      case 'supports_critical_function':
        if (rawValue) {
          const normalized = rawValue.toLowerCase();
          data.supports_critical_function = ['true', 'yes', '1', 'y'].includes(normalized);
        }
        break;

      case 'contact_name':
        if (rawValue) {
          data.contact_name = rawValue;
        }
        break;

      case 'contact_email':
        if (rawValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(rawValue)) {
            errors.push({
              row: rowIndex,
              field: 'contact_email',
              message: 'Invalid email format',
              value: rawValue,
            });
          }
          data.contact_email = rawValue;
        }
        break;

      case 'notes':
        if (rawValue) {
          data.notes = rawValue;
        }
        break;
    }
  }

  // Validate against schema
  const result = bulkImportRowSchema.safeParse(data);
  const isValid = result.success && errors.length === 0;

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        row: rowIndex,
        field: issue.path.join('.'),
        message: issue.message,
        value: String(data[issue.path[0] as string] || ''),
      });
    }
  }

  return {
    rowIndex,
    data: result.success ? result.data : (data as BulkImportRow),
    isValid,
    errors,
    warnings,
  };
}

// ============================================================================
// Import Preview
// ============================================================================

/**
 * Generate an import preview with validation
 */
export function generateImportPreview(
  parsedCSV: ParsedCSV,
  mappings: ColumnMapping[]
): ImportPreview {
  const rows: ValidatedImportRow[] = [];
  const leiSet = new Set<string>();
  const nameSet = new Set<string>();
  const duplicateLEIs: string[] = [];
  const duplicateNames: string[] = [];

  for (let i = 0; i < parsedCSV.rows.length; i++) {
    const row = parsedCSV.rows[i];
    const validated = transformRow(row, mappings, i + 1);
    rows.push(validated);

    // Track duplicates
    if (validated.data.lei) {
      if (leiSet.has(validated.data.lei)) {
        duplicateLEIs.push(validated.data.lei);
      }
      leiSet.add(validated.data.lei);
    }

    if (validated.data.name) {
      const normalizedName = validated.data.name.toLowerCase();
      if (nameSet.has(normalizedName)) {
        duplicateNames.push(validated.data.name);
      }
      nameSet.add(normalizedName);
    }
  }

  const validRows = rows.filter(r => r.isValid).length;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
    rows,
    duplicateLEIs: [...new Set(duplicateLEIs)],
    duplicateNames: [...new Set(duplicateNames)],
  };
}

// ============================================================================
// CSV Template Generation
// ============================================================================

/**
 * Generate a sample CSV template for vendor imports
 */
export function generateCSVTemplate(): string {
  const headers = Object.keys(VENDOR_IMPORT_FIELDS).join(',');
  const examples = Object.values(VENDOR_IMPORT_FIELDS)
    .map(field => `"${field.example}"`)
    .join(',');

  return `${headers}\n${examples}`;
}
