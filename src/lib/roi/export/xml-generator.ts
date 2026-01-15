/**
 * XBRL-XML Generator
 *
 * Generates ESA-compliant XBRL instance documents in XML format.
 * This provides an alternative to xBRL-CSV for systems that prefer traditional XBRL.
 *
 * ESA accepts both formats for DORA Register of Information submissions.
 */

import type { RoiTemplateId, RoiPackageParameters } from '../types';
import { getColumnOrder, TEMPLATE_MAPPINGS } from '../mappings';

// ============================================================================
// Constants
// ============================================================================

const EBA_NAMESPACE = 'http://www.eba.europa.eu/xbrl/crr/dict';
const XBRL_NAMESPACE = 'http://www.xbrl.org/2003/instance';
const LINK_NAMESPACE = 'http://www.xbrl.org/2003/linkbase';
const ISO4217_NAMESPACE = 'http://www.xbrl.org/2003/iso4217';
const DORA_TAXONOMY = 'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/dora/4.0';

// Template to XBRL table mapping (EBA concept names)
const TEMPLATE_CONCEPTS: Record<RoiTemplateId, string> = {
  'B_01.01': 'eba_tRT0101',
  'B_01.02': 'eba_tRT0102',
  'B_01.03': 'eba_tRT0103',
  'B_02.01': 'eba_tRT0201',
  'B_02.02': 'eba_tRT0202',
  'B_02.03': 'eba_tRT0203',
  'B_03.01': 'eba_tRT0301',
  'B_03.02': 'eba_tRT0302',
  'B_03.03': 'eba_tRT0303',
  'B_04.01': 'eba_tRT0401',
  'B_05.01': 'eba_tRT0501',
  'B_05.02': 'eba_tRT0502',
  'B_06.01': 'eba_tRT0601',
  'B_07.01': 'eba_tRT0701',
  'B_99.01': 'eba_tRT9901',
};

// Column code to dimension mapping (reserved for future use with complex XBRL dimensions)
// const COLUMN_DIMENSIONS: Record<string, string> = {
//   c0010: 'eba_dim:BAS',
//   c0020: 'eba_dim:BAS',
//   ...
// };

// ============================================================================
// Types
// ============================================================================

export interface XmlGeneratorOptions {
  parameters: RoiPackageParameters;
  templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>>;
  timestamp?: Date;
  prettyPrint?: boolean;
}

export interface XmlGeneratorResult {
  xml: string;
  fileName: string;
  templateCount: number;
  factCount: number;
}

export interface XmlPackageResult {
  instanceXml: string;
  taxonomyPackageXml: string;
  fileName: string;
  metadata: {
    entityId: string;
    reportingPeriod: string;
    generatedAt: string;
    factCount: number;
    templateCount: number;
  };
}

// ============================================================================
// XML Escaping
// ============================================================================

/**
 * Escape XML special characters
 */
function escapeXml(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date to ISO format (YYYY-MM-DD)
 */
function formatXmlDate(value: unknown): string {
  if (!value) return '';

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    // Already in correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // Try to parse
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return '';
}

/**
 * Format boolean for XBRL
 */
function formatXmlBoolean(value: unknown): string {
  if (value === true || value === 'true' || value === 1) {
    return 'true';
  }
  if (value === false || value === 'false' || value === 0) {
    return 'false';
  }
  return '';
}

/**
 * Format number for XBRL (respecting decimals)
 */
function formatXmlNumber(value: unknown, decimals: number): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return '';
  }

  return num.toFixed(Math.max(0, decimals));
}

// ============================================================================
// Context Generation
// ============================================================================

/**
 * Generate unique context ID for a row
 */
function generateContextId(templateId: RoiTemplateId, rowIndex: number): string {
  const safeId = templateId.replace('.', '_');
  return `ctx_${safeId}_r${rowIndex}`;
}

/**
 * Generate XBRL context element
 */
function generateContext(
  contextId: string,
  entityId: string,
  periodEnd: string,
  templateId: RoiTemplateId,
  indent: string = ''
): string {
  const concept = TEMPLATE_CONCEPTS[templateId];

  return `${indent}<xbrli:context id="${contextId}">
${indent}  <xbrli:entity>
${indent}    <xbrli:identifier scheme="http://standards.iso.org/iso/17442">${escapeXml(entityId)}</xbrli:identifier>
${indent}  </xbrli:entity>
${indent}  <xbrli:period>
${indent}    <xbrli:instant>${periodEnd}</xbrli:instant>
${indent}  </xbrli:period>
${indent}  <xbrli:scenario>
${indent}    <xbrldi:explicitMember dimension="eba_dim:BAS">${concept}</xbrldi:explicitMember>
${indent}  </xbrli:scenario>
${indent}</xbrli:context>`;
}

// ============================================================================
// Fact Generation
// ============================================================================

/**
 * Generate a single XBRL fact element
 */
function generateFact(
  columnCode: string,
  value: unknown,
  contextId: string,
  unitRef: string | null,
  decimals: number,
  dataType: string,
  indent: string = ''
): string {
  // Skip null/undefined values
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // Format value based on data type
  let formattedValue: string;
  let attributes = `contextRef="${contextId}"`;

  switch (dataType) {
    case 'date':
      formattedValue = formatXmlDate(value);
      break;
    case 'boolean':
      formattedValue = formatXmlBoolean(value);
      break;
    case 'number':
      formattedValue = formatXmlNumber(value, decimals);
      if (unitRef) {
        attributes += ` unitRef="${unitRef}" decimals="${decimals}"`;
      }
      break;
    default:
      formattedValue = escapeXml(value);
  }

  if (!formattedValue) {
    return '';
  }

  // EBA concept naming: eba_met:mi{column} (e.g., eba_met:mic0010)
  const concept = `eba_met:mi${columnCode}`;

  return `${indent}<${concept} ${attributes}>${formattedValue}</${concept}>`;
}

// ============================================================================
// Template XML Generation
// ============================================================================

/**
 * Generate XBRL facts for a single template
 */
function generateTemplateFacts(
  templateId: RoiTemplateId,
  data: Record<string, unknown>[],
  entityId: string,
  periodEnd: string,
  decimalsInteger: number,
  decimalsMonetary: number,
  indent: string = ''
): { contexts: string[]; facts: string[]; factCount: number } {
  const contexts: string[] = [];
  const facts: string[] = [];
  let factCount = 0;

  const columns = getColumnOrder(templateId);
  const mapping = TEMPLATE_MAPPINGS[templateId];

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const contextId = generateContextId(templateId, rowIndex);

    // Generate context for this row
    contexts.push(generateContext(contextId, entityId, periodEnd, templateId, indent));

    // Generate facts for each column
    for (const columnCode of columns) {
      const value = row[columnCode];
      const columnMapping = mapping?.[columnCode];

      // Determine data type and decimals
      const dataType = columnMapping?.dataType || 'string';
      const isMonetary = columnCode === 'c0050' || columnCode === 'c0100' || columnCode === 'c0110';
      const decimals = isMonetary ? decimalsMonetary : decimalsInteger;
      const unitRef = dataType === 'number' && isMonetary ? 'unit_EUR' : null;

      const fact = generateFact(columnCode, value, contextId, unitRef, decimals, dataType, indent);
      if (fact) {
        facts.push(fact);
        factCount++;
      }
    }
  }

  return { contexts, facts, factCount };
}

// ============================================================================
// Unit Generation
// ============================================================================

/**
 * Generate XBRL unit elements
 */
function generateUnits(currency: string, indent: string = ''): string {
  // Extract currency code from prefixed format (e.g., "iso4217:EUR" -> "EUR")
  const currencyCode = currency.replace(/^iso4217:/, '').toUpperCase();

  return `${indent}<xbrli:unit id="unit_${currencyCode}">
${indent}  <xbrli:measure>iso4217:${currencyCode}</xbrli:measure>
${indent}</xbrli:unit>
${indent}<xbrli:unit id="unit_pure">
${indent}  <xbrli:measure>xbrli:pure</xbrli:measure>
${indent}</xbrli:unit>`;
}

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Generate a complete XBRL instance document
 */
export function generateXbrlInstance(options: XmlGeneratorOptions): XmlGeneratorResult {
  const {
    parameters,
    templateData,
    timestamp = new Date(),
    prettyPrint = true,
  } = options;

  const indent = prettyPrint ? '  ' : '';
  const newline = prettyPrint ? '\n' : '';

  // Extract entity ID (remove 'rs:' prefix if present)
  const entityId = parameters.entityId.replace(/^rs:/, '');
  const periodEnd = parameters.refPeriod;
  const currency = parameters.baseCurrency;

  // Collect all contexts and facts
  const allContexts: string[] = [];
  const allFacts: string[] = [];
  let totalFactCount = 0;
  let templateCount = 0;

  // All 15 DORA RoI templates
  const ALL_TEMPLATES: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01', 'B_99.01',
  ];

  for (const templateId of ALL_TEMPLATES) {
    const data = templateData[templateId];
    if (!data || data.length === 0) continue;

    const { contexts, facts, factCount } = generateTemplateFacts(
      templateId,
      data,
      entityId,
      periodEnd,
      parameters.decimalsInteger,
      parameters.decimalsMonetary,
      indent + indent
    );

    allContexts.push(...contexts);
    allFacts.push(...facts);
    totalFactCount += factCount;
    templateCount++;
  }

  // Build the complete XBRL instance document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl
  xmlns:xbrli="${XBRL_NAMESPACE}"
  xmlns:link="${LINK_NAMESPACE}"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:iso4217="${ISO4217_NAMESPACE}"
  xmlns:xbrldi="http://xbrl.org/2006/xbrldi"
  xmlns:eba_met="${EBA_NAMESPACE}/met"
  xmlns:eba_dim="${EBA_NAMESPACE}/dim"
  xmlns:eba_typ="${EBA_NAMESPACE}/typ">
${newline}${indent}<!-- DORA Register of Information - XBRL Instance -->
${indent}<!-- Generated by DORA Comply on ${timestamp.toISOString()} -->
${indent}<!-- Entity: ${escapeXml(entityId)} -->
${indent}<!-- Period: ${periodEnd} -->
${newline}${indent}<!-- Schema References -->
${indent}<link:schemaRef xlink:type="simple" xlink:href="${DORA_TAXONOMY}/mod/dora.xsd"/>
${newline}${indent}<!-- Units -->
${generateUnits(currency, indent)}
${newline}${indent}<!-- Contexts -->
${allContexts.join(newline)}
${newline}${indent}<!-- Facts -->
${allFacts.join(newline)}
${newline}</xbrli:xbrl>`;

  // Generate file name
  const ts = timestamp.toISOString().replace(/[-T:.Z]/g, '').slice(0, 17);
  const fileName = `${entityId}_DORA_${periodEnd}_${ts}.xml`;

  return {
    xml,
    fileName,
    templateCount,
    factCount: totalFactCount,
  };
}

/**
 * Generate a complete XBRL package (instance + taxonomy package descriptor)
 */
export function generateXbrlPackage(options: XmlGeneratorOptions): XmlPackageResult {
  const { parameters, timestamp = new Date() } = options;

  // Generate the instance document
  const instanceResult = generateXbrlInstance(options);

  // Generate taxonomy package descriptor (for completeness)
  const taxonomyPackageXml = `<?xml version="1.0" encoding="UTF-8"?>
<tp:taxonomyPackage
  xmlns:tp="http://xbrl.org/2016/taxonomy-package"
  xml:lang="en">
  <tp:identifier>http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/dora/4.0</tp:identifier>
  <tp:name>DORA Register of Information</tp:name>
  <tp:description>EBA DORA Regulatory Framework - Register of Information</tp:description>
  <tp:version>4.0</tp:version>
  <tp:publisher>European Banking Authority</tp:publisher>
  <tp:publisherURL>https://www.eba.europa.eu</tp:publisherURL>
  <tp:publisherCountry>EU</tp:publisherCountry>
  <tp:publicationDate>${timestamp.toISOString().split('T')[0]}</tp:publicationDate>
  <tp:entryPoints>
    <tp:entryPoint>
      <tp:name>DORA RoI Entry Point</tp:name>
      <tp:entryPointDocument href="mod/dora.xsd"/>
    </tp:entryPoint>
  </tp:entryPoints>
</tp:taxonomyPackage>`;

  const entityId = parameters.entityId.replace(/^rs:/, '');

  return {
    instanceXml: instanceResult.xml,
    taxonomyPackageXml,
    fileName: instanceResult.fileName,
    metadata: {
      entityId,
      reportingPeriod: parameters.refPeriod,
      generatedAt: timestamp.toISOString(),
      factCount: instanceResult.factCount,
      templateCount: instanceResult.templateCount,
    },
  };
}

/**
 * Validate XBRL instance document structure (basic validation)
 */
export function validateXbrlStructure(xml: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for XML declaration
  if (!xml.startsWith('<?xml')) {
    errors.push('Missing XML declaration');
  }

  // Check for root element
  if (!xml.includes('<xbrli:xbrl')) {
    errors.push('Missing xbrli:xbrl root element');
  }

  // Check for required namespaces
  const requiredNamespaces = ['xbrli', 'link', 'eba_met'];
  for (const ns of requiredNamespaces) {
    if (!xml.includes(`xmlns:${ns}`)) {
      errors.push(`Missing required namespace: ${ns}`);
    }
  }

  // Check for schema reference
  if (!xml.includes('schemaRef')) {
    warnings.push('Missing schema reference (link:schemaRef)');
  }

  // Check for at least one context
  if (!xml.includes('<xbrli:context')) {
    warnings.push('No contexts found - document may be empty');
  }

  // Check for proper closing
  if (!xml.includes('</xbrli:xbrl>')) {
    errors.push('Missing closing xbrli:xbrl tag');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
