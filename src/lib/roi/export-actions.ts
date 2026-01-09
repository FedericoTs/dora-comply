/**
 * RoI Export Server Actions
 *
 * Server actions for exporting the Register of Information
 * in both xBRL-CSV (primary) and XBRL-XML (alternative) formats.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { RoiTemplateId, RoiPackageParameters } from './types';
import { buildPackageZip, getDefaultParameters } from './export';
import { generateXbrlInstance, generateXbrlPackage } from './export/xml-generator';
import {
  fetchB_01_01,
  fetchB_01_02,
  fetchB_01_03,
  fetchB_02_01,
  fetchB_02_02,
  fetchB_03_01,
  fetchB_03_02,
  fetchB_05_01,
  fetchB_05_02,
  fetchB_06_01,
  fetchB_07_01,
} from './queries';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'csv' | 'xml' | 'both';

export interface ExportOptions {
  format: ExportFormat;
  parameters?: Partial<RoiPackageParameters>;
  includeEmptyTemplates?: boolean;
}

export interface ExportResult {
  success: boolean;
  error?: string;
  csvPackage?: {
    buffer: string; // Base64 encoded
    fileName: string;
    size: number;
  };
  xmlPackage?: {
    instanceXml: string;
    taxonomyPackageXml?: string;
    fileName: string;
    metadata: {
      entityId: string;
      reportingPeriod: string;
      generatedAt: string;
      factCount: number;
      templateCount: number;
    };
  };
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch all template data for export
 */
async function fetchAllTemplateData(): Promise<Partial<Record<RoiTemplateId, Record<string, unknown>[]>>> {
  const supabase = await createClient();

  // Get user's organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Fetch data from all templates in parallel
  const [
    b0101,
    b0102,
    b0103,
    b0201,
    b0202,
    b0301,
    b0302,
    b0501,
    b0502,
    b0601,
    b0701,
  ] = await Promise.all([
    fetchB_01_01().catch(() => []),
    fetchB_01_02().catch(() => []),
    fetchB_01_03().catch(() => []),
    fetchB_02_01().catch(() => []),
    fetchB_02_02().catch(() => []),
    fetchB_03_01().catch(() => []),
    fetchB_03_02().catch(() => []),
    fetchB_05_01().catch(() => []),
    fetchB_05_02().catch(() => []),
    fetchB_06_01().catch(() => []),
    fetchB_07_01().catch(() => []),
  ]);

  // Build template data map
  const templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>> = {
    'B_01.01': b0101 as Record<string, unknown>[],
    'B_01.02': b0102 as Record<string, unknown>[],
    'B_01.03': b0103 as Record<string, unknown>[],
    'B_02.01': b0201 as Record<string, unknown>[],
    'B_02.02': b0202 as Record<string, unknown>[],
    'B_02.03': [], // Link table - generated from relationships
    'B_03.01': b0301 as Record<string, unknown>[],
    'B_03.02': b0302 as Record<string, unknown>[],
    'B_03.03': [], // Link table - generated from relationships
    'B_04.01': [], // Service recipients - derived from B_02.02
    'B_05.01': b0501 as Record<string, unknown>[],
    'B_05.02': b0502 as Record<string, unknown>[],
    'B_06.01': b0601 as Record<string, unknown>[],
    'B_07.01': b0701 as Record<string, unknown>[],
    'B_99.01': [], // Lookup values
  };

  return templateData;
}

/**
 * Get organization parameters for export
 */
async function getOrganizationParameters(): Promise<RoiPackageParameters> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get organization data
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('No organization found');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('lei, reporting_currency')
    .eq('id', userData.organization_id)
    .single();

  // Use organization LEI or a placeholder
  const lei = org?.lei || 'UNKNOWN00000000000000';
  const reportingDate = new Date().toISOString().split('T')[0];
  const defaults = getDefaultParameters(lei, reportingDate);

  return {
    ...defaults,
    baseCurrency: org?.reporting_currency
      ? `iso4217:${org.reporting_currency}`
      : defaults.baseCurrency,
  };
}

// ============================================================================
// Main Export Actions
// ============================================================================

/**
 * Export Register of Information in specified format(s)
 */
export async function exportRoi(options: ExportOptions): Promise<ExportResult> {
  const { format, parameters: customParams, includeEmptyTemplates = false } = options;

  try {
    // Get parameters
    const baseParams = await getOrganizationParameters();
    const parameters: RoiPackageParameters = {
      ...baseParams,
      ...customParams,
    };

    // Fetch all template data
    const templateData = await fetchAllTemplateData();

    // Filter out empty templates if requested
    const exportData = includeEmptyTemplates
      ? templateData
      : Object.fromEntries(
          Object.entries(templateData).filter(([, data]) => data && data.length > 0)
        ) as Partial<Record<RoiTemplateId, Record<string, unknown>[]>>;

    const result: ExportResult = { success: true };

    // Generate CSV package
    if (format === 'csv' || format === 'both') {
      const { buffer, fileName } = await buildPackageZip({
        parameters,
        templateData: exportData,
      });

      result.csvPackage = {
        buffer: buffer.toString('base64'),
        fileName,
        size: buffer.length,
      };
    }

    // Generate XML package
    if (format === 'xml' || format === 'both') {
      const xmlResult = generateXbrlPackage({
        parameters,
        templateData: exportData,
      });

      result.xmlPackage = {
        instanceXml: xmlResult.instanceXml,
        taxonomyPackageXml: xmlResult.taxonomyPackageXml,
        fileName: xmlResult.fileName,
        metadata: xmlResult.metadata,
      };

      // Validate XML structure
      const { validateXbrlStructure } = await import('./export/xml-generator');
      result.validation = validateXbrlStructure(xmlResult.instanceXml);
    }

    return result;
  } catch (error) {
    console.error('[Export RoI] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Export as xBRL-CSV package (ZIP file)
 * This is the primary ESA submission format
 */
export async function exportRoiAsCsv(
  customParams?: Partial<RoiPackageParameters>
): Promise<{ success: boolean; buffer?: string; fileName?: string; error?: string }> {
  const result = await exportRoi({ format: 'csv', parameters: customParams });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    buffer: result.csvPackage?.buffer,
    fileName: result.csvPackage?.fileName,
  };
}

/**
 * Export as XBRL-XML instance document
 * Alternative format for legacy systems
 */
export async function exportRoiAsXml(
  customParams?: Partial<RoiPackageParameters>
): Promise<{ success: boolean; xml?: string; fileName?: string; validation?: ExportResult['validation']; error?: string }> {
  const result = await exportRoi({ format: 'xml', parameters: customParams });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    xml: result.xmlPackage?.instanceXml,
    fileName: result.xmlPackage?.fileName,
    validation: result.validation,
  };
}

/**
 * Get export preview (metadata only, no actual export)
 */
export async function getExportPreview(): Promise<{
  success: boolean;
  error?: string;
  preview?: {
    entityId: string;
    reportingPeriod: string;
    templateCounts: Record<string, number>;
    totalRows: number;
    estimatedCsvSize: string;
    estimatedXmlSize: string;
  };
}> {
  try {
    const parameters = await getOrganizationParameters();
    const templateData = await fetchAllTemplateData();

    // Calculate counts
    const templateCounts: Record<string, number> = {};
    let totalRows = 0;

    for (const [templateId, data] of Object.entries(templateData)) {
      const count = data?.length || 0;
      templateCounts[templateId] = count;
      totalRows += count;
    }

    // Estimate sizes (rough calculation)
    const avgRowBytes = 200; // Average bytes per CSV row
    const estimatedCsvBytes = totalRows * avgRowBytes + 5000; // Plus overhead
    const estimatedXmlBytes = totalRows * avgRowBytes * 3; // XML is ~3x larger

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return {
      success: true,
      preview: {
        entityId: parameters.entityId.replace('rs:', ''),
        reportingPeriod: parameters.refPeriod,
        templateCounts,
        totalRows,
        estimatedCsvSize: formatSize(estimatedCsvBytes),
        estimatedXmlSize: formatSize(estimatedXmlBytes),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed',
    };
  }
}

/**
 * Validate export readiness
 */
export async function validateExportReadiness(): Promise<{
  ready: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    const parameters = await getOrganizationParameters();
    const templateData = await fetchAllTemplateData();

    // Check entity ID
    if (!parameters.entityId || parameters.entityId === 'rs:' || parameters.entityId === 'rs:UNKNOWN') {
      issues.push('Organization LEI is not configured. Set your LEI in Organization Settings.');
    }

    // Check required templates have data
    const requiredTemplates: RoiTemplateId[] = ['B_01.01', 'B_01.02', 'B_05.01'];
    for (const templateId of requiredTemplates) {
      const data = templateData[templateId];
      if (!data || data.length === 0) {
        issues.push(`Required template ${templateId} has no data`);
      }
    }

    // Check for empty optional templates (warnings only)
    const optionalTemplates: RoiTemplateId[] = ['B_02.01', 'B_02.02', 'B_06.01', 'B_07.01'];
    for (const templateId of optionalTemplates) {
      const data = templateData[templateId];
      if (!data || data.length === 0) {
        warnings.push(`Template ${templateId} is empty`);
      }
    }

    // Check vendor data
    const vendorData = templateData['B_05.01'] || [];
    if (vendorData.length === 0) {
      issues.push('No ICT providers registered. Add vendors before export.');
    }

    return {
      ready: issues.length === 0,
      issues,
      warnings,
    };
  } catch (error) {
    return {
      ready: false,
      issues: [error instanceof Error ? error.message : 'Validation failed'],
      warnings: [],
    };
  }
}
