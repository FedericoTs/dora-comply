/**
 * SOC2-to-RoI Auto-Population
 *
 * Core logic for extracting RoI-relevant data from parsed SOC2 reports
 * This is the 10X market differentiator - no competitor does this automatically
 */

import type { ParsedSOC2Report, ExtractedSubserviceOrg } from '@/lib/ai/parsers/types';
import type {
  SOC2ToRoiMappingResult,
  ExtractedVendorData,
  ExtractedServiceData,
  ExtractedSubcontractorData,
  ConfidenceScores,
  ConfidenceFactors,
  ExtractionDetails,
  ExtractionWarning,
  RoiTemplateSuggestion,
  IctServiceType,
} from './soc2-to-roi-types';
import { SERVICE_TYPE_KEYWORDS } from './soc2-to-roi-types';

// ============================================================================
// Main Mapping Function
// ============================================================================

/**
 * Maps parsed SOC2 report data to RoI-compatible structures
 *
 * @param parsedSoc2 - The parsed SOC2 report from AI extraction
 * @param documentId - ID of the source document
 * @param organizationId - ID of the organization
 * @returns Complete mapping result with extracted data
 */
export function mapSOC2ToRoi(
  parsedSoc2: ParsedSOC2Report,
  documentId: string,
  organizationId: string
): SOC2ToRoiMappingResult {
  const startTime = Date.now();
  const warnings: ExtractionWarning[] = [];
  const fieldsExtracted: string[] = [];
  const fieldsMissing: string[] = [];

  // Extract vendor data
  const vendor = extractVendorData(parsedSoc2, documentId, fieldsExtracted, fieldsMissing, warnings);

  // Extract service data
  const services = extractServiceData(parsedSoc2, documentId, fieldsExtracted, fieldsMissing, warnings);

  // Extract subcontractor data
  const subcontractors = extractSubcontractorData(parsedSoc2, documentId, fieldsExtracted, fieldsMissing, warnings);

  // Calculate confidence scores
  const confidenceFactors = calculateConfidenceFactors(parsedSoc2, vendor, services, subcontractors);
  const confidenceScores = calculateConfidenceScores(confidenceFactors, vendor, services, subcontractors);

  // Generate RoI template suggestions
  const roiTemplatesSuggested = generateTemplateSuggestions(vendor, services, subcontractors);

  // Determine overall status
  const status = determineExtractionStatus(vendor, services, subcontractors, warnings);

  const processingTimeMs = Date.now() - startTime;

  return {
    parsedSoc2Id: '', // Will be set by caller
    documentId,
    organizationId,
    vendor,
    services,
    subcontractors,
    status,
    confidenceScores,
    details: {
      fieldsExtracted,
      fieldsMissing,
      warnings,
      processingTimeMs,
    },
    roiTemplatesSuggested,
  };
}

// ============================================================================
// Vendor Extraction
// ============================================================================

function extractVendorData(
  parsedSoc2: ParsedSOC2Report,
  documentId: string,
  fieldsExtracted: string[],
  fieldsMissing: string[],
  warnings: ExtractionWarning[]
): ExtractedVendorData | null {
  // Check if we have the required service org name
  if (!parsedSoc2.serviceOrgName) {
    warnings.push({
      field: 'serviceOrgName',
      message: 'Service organization name not found in SOC2 report',
      severity: 'error',
    });
    fieldsMissing.push('serviceOrgName');
    return null;
  }

  fieldsExtracted.push('serviceOrgName');

  const vendor: ExtractedVendorData = {
    name: parsedSoc2.serviceOrgName,
    description: parsedSoc2.serviceOrgDescription || parsedSoc2.systemDescription?.substring(0, 500),
    source_type: 'soc2_extraction',
    source_document_id: documentId,
    confidence: 85, // Base confidence for having a name
  };

  // Add audit metadata if available
  if (parsedSoc2.auditFirm) {
    vendor.last_soc2_audit_firm = parsedSoc2.auditFirm;
    fieldsExtracted.push('auditFirm');
    vendor.confidence += 5;
  } else {
    fieldsMissing.push('auditFirm');
  }

  if (parsedSoc2.periodEnd) {
    vendor.last_soc2_audit_date = parsedSoc2.periodEnd.split('T')[0];
    fieldsExtracted.push('periodEnd');
    vendor.confidence += 5;
  } else {
    fieldsMissing.push('periodEnd');
  }

  if (parsedSoc2.reportType) {
    vendor.soc2_report_type = parsedSoc2.reportType;
    fieldsExtracted.push('reportType');
  }

  if (parsedSoc2.opinion) {
    vendor.soc2_opinion = parsedSoc2.opinion;
    fieldsExtracted.push('opinion');
  }

  // Cap confidence at 100
  vendor.confidence = Math.min(vendor.confidence, 100);

  return vendor;
}

// ============================================================================
// Service Extraction
// ============================================================================

function extractServiceData(
  parsedSoc2: ParsedSOC2Report,
  documentId: string,
  fieldsExtracted: string[],
  fieldsMissing: string[],
  warnings: ExtractionWarning[]
): ExtractedServiceData[] {
  const services: ExtractedServiceData[] = [];

  // Create primary service from system description
  if (parsedSoc2.systemDescription) {
    fieldsExtracted.push('systemDescription');

    // Classify service type from components
    const allComponents = [
      ...(parsedSoc2.infrastructureComponents || []),
      ...(parsedSoc2.softwareComponents || []),
      parsedSoc2.systemDescription,
    ];

    const serviceType = classifyServiceType(allComponents);

    const service: ExtractedServiceData = {
      service_name: `${parsedSoc2.serviceOrgName || 'Unknown'} Service`,
      service_type: serviceType,
      description: parsedSoc2.systemDescription.substring(0, 1000),
      system_boundaries: parsedSoc2.systemBoundaries,
      infrastructure_components: parsedSoc2.infrastructureComponents || [],
      software_components: parsedSoc2.softwareComponents || [],
      stores_data: detectDataStorage(parsedSoc2),
      data_categories: parsedSoc2.dataCategories || [],
      trust_services_criteria: parsedSoc2.trustServicesCriteria || [],
      source_type: 'soc2_extraction',
      source_document_id: documentId,
      confidence: calculateServiceConfidence(parsedSoc2),
    };

    services.push(service);

    // Track extracted fields
    if (parsedSoc2.systemBoundaries) fieldsExtracted.push('systemBoundaries');
    if (parsedSoc2.infrastructureComponents?.length) fieldsExtracted.push('infrastructureComponents');
    if (parsedSoc2.softwareComponents?.length) fieldsExtracted.push('softwareComponents');
    if (parsedSoc2.dataCategories?.length) fieldsExtracted.push('dataCategories');
  } else {
    fieldsMissing.push('systemDescription');
    warnings.push({
      field: 'systemDescription',
      message: 'No system description found - service details will be minimal',
      severity: 'warning',
    });
  }

  return services;
}

// ============================================================================
// Subcontractor Extraction
// ============================================================================

function extractSubcontractorData(
  parsedSoc2: ParsedSOC2Report,
  documentId: string,
  fieldsExtracted: string[],
  fieldsMissing: string[],
  warnings: ExtractionWarning[]
): ExtractedSubcontractorData[] {
  const subcontractors: ExtractedSubcontractorData[] = [];

  if (!parsedSoc2.subserviceOrgs || parsedSoc2.subserviceOrgs.length === 0) {
    fieldsMissing.push('subserviceOrgs');
    // This is informational, not an error - some SOC2s have no subservice orgs
    return subcontractors;
  }

  fieldsExtracted.push('subserviceOrgs');

  for (const subOrg of parsedSoc2.subserviceOrgs) {
    if (!subOrg.name) {
      warnings.push({
        field: 'subserviceOrgs[].name',
        message: 'Subservice organization found without name - skipping',
        severity: 'warning',
      });
      continue;
    }

    // Classify service type for subcontractor
    const serviceType = classifyServiceType([
      subOrg.name,
      subOrg.serviceDescription || '',
    ]);

    const subcontractor: ExtractedSubcontractorData = {
      subcontractor_name: subOrg.name,
      service_description: subOrg.serviceDescription,
      inclusion_method: subOrg.inclusionMethod || 'carve_out',
      controls_supported: subOrg.controlsSupported || [],
      has_own_soc2: subOrg.hasOwnSoc2 ?? false,
      soc2_location_reference: subOrg.location,
      tier_level: 1, // Direct subcontractor from SOC2 = tier 1
      is_direct_subcontractor: true,
      service_type: serviceType,
      source_type: 'soc2_extraction',
      source_document_id: documentId,
      confidence: calculateSubcontractorConfidence(subOrg),
    };

    subcontractors.push(subcontractor);
  }

  return subcontractors;
}

// ============================================================================
// Service Type Classification
// ============================================================================

/**
 * Classifies service type based on keywords in components
 */
export function classifyServiceType(components: string[]): IctServiceType {
  const text = components.join(' ').toLowerCase();

  // Check each service type in order of specificity
  const typeOrder: IctServiceType[] = [
    'payment_services',
    'security_services',
    'data_analytics',
    'data_management',
    'network_services',
    'platform_as_service',
    'infrastructure_as_service',
    'software_as_service',
    'cloud_computing',
    'hardware',
  ];

  for (const serviceType of typeOrder) {
    const keywords = SERVICE_TYPE_KEYWORDS[serviceType];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return serviceType;
      }
    }
  }

  return 'other';
}

// ============================================================================
// Confidence Calculation
// ============================================================================

function calculateConfidenceFactors(
  parsedSoc2: ParsedSOC2Report,
  vendor: ExtractedVendorData | null,
  services: ExtractedServiceData[],
  subcontractors: ExtractedSubcontractorData[]
): ConfidenceFactors {
  return {
    hasServiceOrgName: !!parsedSoc2.serviceOrgName,
    hasSystemDescription: !!parsedSoc2.systemDescription,
    hasSubserviceOrgs: (parsedSoc2.subserviceOrgs?.length ?? 0) > 0,
    hasAuditMetadata: !!parsedSoc2.auditFirm && !!parsedSoc2.periodEnd,
    hasInfrastructureComponents: (parsedSoc2.infrastructureComponents?.length ?? 0) > 0,
    hasControlsExtracted: (parsedSoc2.controls?.length ?? 0) > 0,
  };
}

function calculateConfidenceScores(
  factors: ConfidenceFactors,
  vendor: ExtractedVendorData | null,
  services: ExtractedServiceData[],
  subcontractors: ExtractedSubcontractorData[]
): ConfidenceScores {
  // Factor weights
  const weights = {
    serviceOrgName: 25,
    systemDescription: 15,
    subserviceOrgs: 20,
    auditMetadata: 15,
    infrastructureComponents: 15,
    controlsExtracted: 10,
  };

  let overall = 0;
  if (factors.hasServiceOrgName) overall += weights.serviceOrgName;
  if (factors.hasSystemDescription) overall += weights.systemDescription;
  if (factors.hasSubserviceOrgs) overall += weights.subserviceOrgs;
  if (factors.hasAuditMetadata) overall += weights.auditMetadata;
  if (factors.hasInfrastructureComponents) overall += weights.infrastructureComponents;
  if (factors.hasControlsExtracted) overall += weights.controlsExtracted;

  return {
    vendor: vendor?.confidence ?? 0,
    services: services.length > 0
      ? services.reduce((sum, s) => sum + s.confidence, 0) / services.length
      : 0,
    subcontractors: subcontractors.length > 0
      ? subcontractors.reduce((sum, s) => sum + s.confidence, 0) / subcontractors.length
      : 0,
    overall,
  };
}

function calculateServiceConfidence(parsedSoc2: ParsedSOC2Report): number {
  let confidence = 50; // Base confidence

  if (parsedSoc2.systemDescription) confidence += 15;
  if (parsedSoc2.systemBoundaries) confidence += 10;
  if (parsedSoc2.infrastructureComponents?.length) confidence += 10;
  if (parsedSoc2.softwareComponents?.length) confidence += 10;
  if (parsedSoc2.trustServicesCriteria?.length) confidence += 5;

  return Math.min(confidence, 100);
}

function calculateSubcontractorConfidence(subOrg: ExtractedSubserviceOrg): number {
  let confidence = 60; // Base confidence for having a name

  if (subOrg.serviceDescription) confidence += 15;
  if (subOrg.inclusionMethod) confidence += 10;
  if (subOrg.controlsSupported?.length) confidence += 10;
  if (subOrg.hasOwnSoc2 !== undefined) confidence += 5;

  return Math.min(confidence, 100);
}

// ============================================================================
// Helper Functions
// ============================================================================

function detectDataStorage(parsedSoc2: ParsedSOC2Report): boolean {
  // Check if the system description mentions data storage
  const storageKeywords = ['store', 'data', 'database', 'storage', 'persist', 'customer data'];
  const text = [
    parsedSoc2.systemDescription || '',
    ...(parsedSoc2.dataCategories || []),
  ].join(' ').toLowerCase();

  return storageKeywords.some(keyword => text.includes(keyword));
}

function determineExtractionStatus(
  vendor: ExtractedVendorData | null,
  services: ExtractedServiceData[],
  subcontractors: ExtractedSubcontractorData[],
  warnings: ExtractionWarning[]
): 'completed' | 'partial' | 'failed' {
  const hasErrors = warnings.some(w => w.severity === 'error');

  if (hasErrors || (!vendor && services.length === 0)) {
    return 'failed';
  }

  if (!vendor || services.length === 0) {
    return 'partial';
  }

  return 'completed';
}

function generateTemplateSuggestions(
  vendor: ExtractedVendorData | null,
  services: ExtractedServiceData[],
  subcontractors: ExtractedSubcontractorData[]
): RoiTemplateSuggestion[] {
  const suggestions: RoiTemplateSuggestion[] = [];

  // B_05.01 - ICT Providers
  if (vendor) {
    const vendorFields = [
      vendor.name ? 1 : 0,
      vendor.description ? 1 : 0,
      vendor.headquarters_country ? 1 : 0,
      vendor.last_soc2_audit_firm ? 1 : 0,
      vendor.last_soc2_audit_date ? 1 : 0,
    ];
    const populated = vendorFields.reduce((a, b) => a + b, 0);
    const total = 12; // Total fields in B_05.01

    suggestions.push({
      templateId: 'B_05.01',
      templateName: 'ICT Third-Party Service Providers',
      fieldsPopulated: populated,
      totalFields: total,
      coverage: Math.round((populated / total) * 100),
    });
  }

  // B_02.02 - Contractual Arrangements Details
  if (services.length > 0) {
    const service = services[0];
    const serviceFields = [
      service.service_name ? 1 : 0,
      service.service_type ? 1 : 0,
      service.description ? 1 : 0,
      service.infrastructure_components.length > 0 ? 1 : 0,
      service.stores_data !== undefined ? 1 : 0,
    ];
    const populated = serviceFields.reduce((a, b) => a + b, 0);
    const total = 18; // Total fields in B_02.02

    suggestions.push({
      templateId: 'B_02.02',
      templateName: 'Contractual Arrangements - Service Details',
      fieldsPopulated: populated,
      totalFields: total,
      coverage: Math.round((populated / total) * 100),
    });
  }

  // B_05.02 - Subcontracting Chain
  if (subcontractors.length > 0) {
    const avgFields = subcontractors.reduce((sum, sub) => {
      return sum + (sub.subcontractor_name ? 1 : 0)
        + (sub.service_description ? 1 : 0)
        + (sub.inclusion_method ? 1 : 0)
        + (sub.has_own_soc2 !== undefined ? 1 : 0);
    }, 0) / subcontractors.length;
    const total = 7; // Total fields in B_05.02

    suggestions.push({
      templateId: 'B_05.02',
      templateName: 'ICT Subcontracting Chain',
      fieldsPopulated: Math.round(avgFields),
      totalFields: total,
      coverage: Math.round((avgFields / total) * 100),
    });
  }

  return suggestions;
}

// ============================================================================
// Preview Data Generator
// ============================================================================

/**
 * Generates preview data for the UI before actual population
 */
export interface RoiPopulationPreview {
  vendor: {
    name: string;
    description?: string;
    auditInfo?: string;
    confidence: number;
    isNew: boolean;
    existingVendorId?: string;
  } | null;
  services: {
    name: string;
    type: IctServiceType;
    description?: string;
    confidence: number;
  }[];
  subcontractors: {
    name: string;
    serviceType?: IctServiceType;
    inclusionMethod: string;
    hasOwnSoc2: boolean;
    confidence: number;
  }[];
  templatesSuggested: RoiTemplateSuggestion[];
  overallConfidence: number;
}

export function generatePopulationPreview(
  mappingResult: SOC2ToRoiMappingResult,
  existingVendorId?: string
): RoiPopulationPreview {
  return {
    vendor: mappingResult.vendor ? {
      name: mappingResult.vendor.name,
      description: mappingResult.vendor.description,
      auditInfo: mappingResult.vendor.last_soc2_audit_firm
        ? `${mappingResult.vendor.last_soc2_audit_firm} (${mappingResult.vendor.last_soc2_audit_date || 'date unknown'})`
        : undefined,
      confidence: mappingResult.vendor.confidence,
      isNew: !existingVendorId,
      existingVendorId,
    } : null,
    services: mappingResult.services.map(s => ({
      name: s.service_name,
      type: s.service_type,
      description: s.description?.substring(0, 200),
      confidence: s.confidence,
    })),
    subcontractors: mappingResult.subcontractors.map(s => ({
      name: s.subcontractor_name,
      serviceType: s.service_type,
      inclusionMethod: s.inclusion_method === 'inclusive' ? 'Inclusive' : 'Carve-out',
      hasOwnSoc2: s.has_own_soc2,
      confidence: s.confidence,
    })),
    templatesSuggested: mappingResult.roiTemplatesSuggested,
    overallConfidence: mappingResult.confidenceScores.overall,
  };
}
