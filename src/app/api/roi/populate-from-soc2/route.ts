/**
 * API Route: Populate RoI from SOC2 Report
 *
 * PREREQUISITE: Document MUST be linked to an existing vendor.
 * The vendor should be registered first, then the SOC2 document uploaded for that vendor.
 *
 * This endpoint:
 * - Updates the existing vendor with SOC2 audit metadata
 * - Creates ICT services from the system description
 * - Creates subcontractors (fourth parties) from subservice organizations
 *
 * POST /api/roi/populate-from-soc2
 * Body: {
 *   documentId: string,
 *   preview?: boolean,
 *   options?: {
 *     selectedSubcontractors?: string[], // Names of subcontractors to include
 *     createServices?: boolean
 *   }
 * }
 *
 * This is the 10X differentiator - SOC2-to-RoI in One Click
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapSOC2ToRoi, generatePopulationPreview } from '@/lib/roi/soc2-to-roi';
import type { ExistingVendorInfo } from '@/lib/roi/soc2-to-roi';
import type { ParsedSOC2Report } from '@/lib/ai/parsers/types';
import type {
  SOC2ToRoiMappingResult,
  ExtractedServiceData,
  ExtractedSubcontractorData,
  Soc2RoiMappingRecord,
} from '@/lib/roi/soc2-to-roi-types';

interface PopulateOptions {
  selectedSubcontractors?: string[];
  createServices?: boolean;
}

interface PopulateResult {
  success: boolean;
  mappingId?: string;
  vendorId?: string;
  vendorUpdated?: boolean;
  serviceIds?: string[];
  subcontractorIds?: string[];
  confidence?: number;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// GET - Preview what would be populated
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId query parameter is required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    // Fetch the document WITH its linked vendor
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, vendor_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Document MUST have a vendor linked
    if (!document.vendor_id) {
      return NextResponse.json({
        error: 'Document not linked to vendor',
        message: 'This document must be linked to a vendor before populating RoI. Please assign a vendor to this document first.',
        canPopulate: false,
        needsVendor: true,
      }, { status: 400 });
    }

    // Fetch the vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, organization_id')
      .eq('id', document.vendor_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Linked vendor not found' },
        { status: 404 }
      );
    }

    // Fetch the parsed SOC2 data
    const { data: parsedSoc2, error: soc2Error } = await supabase
      .from('parsed_soc2')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (soc2Error || !parsedSoc2) {
      return NextResponse.json(
        { error: 'SOC2 report not found or not yet parsed' },
        { status: 404 }
      );
    }

    // Check for existing mapping
    const { data: existingMapping } = await supabase
      .from('soc2_roi_mappings')
      .select('*')
      .eq('document_id', documentId)
      .single();

    // Reconstruct ParsedSOC2Report from database
    const report: ParsedSOC2Report = reconstructParsedReport(parsedSoc2);

    // Build existing vendor info
    const existingVendor: ExistingVendorInfo = {
      id: vendor.id,
      name: vendor.name,
      organization_id: vendor.organization_id,
    };

    // Generate mapping result with existing vendor
    const mappingResult = mapSOC2ToRoi(report, documentId, existingVendor);
    mappingResult.parsedSoc2Id = parsedSoc2.id;

    // Generate preview
    const preview = generatePopulationPreview(mappingResult, existingVendor);

    return NextResponse.json({
      preview,
      existingMapping: existingMapping ? {
        id: existingMapping.id,
        status: existingMapping.extraction_status,
        isConfirmed: existingMapping.is_confirmed,
        extractedAt: existingMapping.extracted_at,
      } : null,
      canPopulate: mappingResult.status !== 'failed',
    });
  } catch (error) {
    console.error('[API] SOC2 RoI preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Populate RoI from SOC2
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, preview, options = {} } = body as {
      documentId: string;
      preview?: boolean;
      options?: PopulateOptions;
    };

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 });
    }

    const organizationId = profile.organization_id;

    // Fetch the document WITH its linked vendor
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, vendor_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // CRITICAL: Document MUST have a vendor linked
    if (!document.vendor_id) {
      return NextResponse.json({
        success: false,
        error: 'Document not linked to vendor',
        message: 'This document must be linked to a vendor before populating RoI.',
      }, { status: 400 });
    }

    // Fetch the vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, organization_id')
      .eq('id', document.vendor_id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Linked vendor not found' }, { status: 404 });
    }

    // Fetch the parsed SOC2 data
    const { data: parsedSoc2, error: soc2Error } = await supabase
      .from('parsed_soc2')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (soc2Error || !parsedSoc2) {
      return NextResponse.json(
        { error: 'SOC2 report not found or not yet parsed' },
        { status: 404 }
      );
    }

    // Reconstruct ParsedSOC2Report from database
    const report: ParsedSOC2Report = reconstructParsedReport(parsedSoc2);

    // Build existing vendor info
    const existingVendor: ExistingVendorInfo = {
      id: vendor.id,
      name: vendor.name,
      organization_id: vendor.organization_id,
    };

    // Generate mapping result with existing vendor
    const mappingResult = mapSOC2ToRoi(report, documentId, existingVendor);
    mappingResult.parsedSoc2Id = parsedSoc2.id;

    // Preview mode
    if (preview) {
      const previewData = generatePopulationPreview(mappingResult, existingVendor);
      return NextResponse.json({ preview: previewData });
    }

    // Actual population
    const result = await populateRoiData(
      supabase,
      mappingResult,
      existingVendor,
      user.id,
      options
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] SOC2 RoI populate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function reconstructParsedReport(dbRecord: Record<string, unknown>): ParsedSOC2Report {
  // Map database columns to ParsedSOC2Report interface
  const controls = (dbRecord.controls as unknown[]) || [];
  const exceptions = (dbRecord.exceptions as unknown[]) || [];
  const subserviceOrgs = (dbRecord.subservice_orgs as unknown[]) || [];
  const cuecs = (dbRecord.cuecs as unknown[]) || [];
  const rawExtraction = dbRecord.raw_extraction as Record<string, unknown> | null;
  const systemDescription = (dbRecord.system_description as string) || '';

  // Extract vendor name from system_description if not in raw_extraction
  // Format is typically: "Vendor Name – Description" or "Vendor Name - Description"
  let serviceOrgName = (rawExtraction?.serviceOrgName as string) || '';
  if (!serviceOrgName && systemDescription) {
    // Try to extract vendor name from system description
    const dashMatch = systemDescription.match(/^([^–\-]+)[–\-]/);
    if (dashMatch) {
      serviceOrgName = dashMatch[1].trim();
    }
  }

  // Format dates from database columns
  const periodStart = dbRecord.period_start
    ? new Date(dbRecord.period_start as string).toISOString().split('T')[0]
    : '';
  const periodEnd = dbRecord.period_end
    ? new Date(dbRecord.period_end as string).toISOString().split('T')[0]
    : '';

  return {
    reportType: (dbRecord.report_type as 'type1' | 'type2') || 'type2',
    // Prefer database columns over raw_extraction for primary fields
    auditFirm: (dbRecord.audit_firm as string) || (rawExtraction?.auditFirm as string) || '',
    opinion: (dbRecord.opinion as 'unqualified' | 'qualified' | 'adverse') ||
             (rawExtraction?.opinion as 'unqualified' | 'qualified' | 'adverse') || 'unqualified',
    periodStart,
    periodEnd,
    reportDate: (rawExtraction?.reportDate as string) || periodEnd,
    serviceOrgName,
    serviceOrgDescription: (rawExtraction?.serviceOrgDescription as string) || systemDescription,
    trustServicesCriteria: (dbRecord.criteria as ParsedSOC2Report['trustServicesCriteria']) ||
                          (rawExtraction?.trustServicesCriteria as ParsedSOC2Report['trustServicesCriteria']) || [],
    systemDescription,
    systemBoundaries: (rawExtraction?.systemBoundaries as string) || undefined,
    infrastructureComponents: (rawExtraction?.infrastructureComponents as string[]) || undefined,
    softwareComponents: (rawExtraction?.softwareComponents as string[]) || undefined,
    dataCategories: (rawExtraction?.dataCategories as string[]) || undefined,
    controls: controls as ParsedSOC2Report['controls'],
    exceptions: exceptions as ParsedSOC2Report['exceptions'],
    subserviceOrgs: subserviceOrgs as ParsedSOC2Report['subserviceOrgs'],
    cuecs: cuecs as ParsedSOC2Report['cuecs'],
    totalControls: controls.length,
    controlsOperatingEffectively: 0,
    controlsWithExceptions: exceptions.length,
    controlsNotTested: 0,
    confidenceScores: (dbRecord.confidence_scores as ParsedSOC2Report['confidenceScores']) || {
      overall: 0,
      metadata: 0,
      controls: 0,
      exceptions: 0,
      subserviceOrgs: 0,
      cuecs: 0,
    },
    parserVersion: '2.0',
    processedAt: new Date().toISOString(),
    processingTimeMs: 0,
  };
}

async function populateRoiData(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  mappingResult: SOC2ToRoiMappingResult,
  existingVendor: ExistingVendorInfo,
  userId: string,
  options: PopulateOptions
): Promise<PopulateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const vendorId = existingVendor.id;
  let vendorUpdated = false;
  const serviceIds: string[] = [];
  const subcontractorIds: string[] = [];

  try {
    // 1. Update existing vendor with SOC2 audit metadata
    if (mappingResult.vendorUpdate) {
      const updateData: Record<string, unknown> = {
        source_document_id: mappingResult.documentId,
        updated_at: new Date().toISOString(),
      };

      if (mappingResult.vendorUpdate.last_soc2_audit_firm) {
        updateData.last_soc2_audit_firm = mappingResult.vendorUpdate.last_soc2_audit_firm;
      }
      if (mappingResult.vendorUpdate.last_soc2_audit_date) {
        updateData.last_soc2_audit_date = mappingResult.vendorUpdate.last_soc2_audit_date;
      }
      if (mappingResult.vendorUpdate.soc2_report_type) {
        updateData.soc2_report_type = mappingResult.vendorUpdate.soc2_report_type;
      }
      if (mappingResult.vendorUpdate.soc2_opinion) {
        updateData.soc2_opinion = mappingResult.vendorUpdate.soc2_opinion;
      }

      const { error: updateError } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', vendorId);

      if (updateError) {
        warnings.push(`Failed to update vendor: ${updateError.message}`);
      } else {
        vendorUpdated = true;
      }
    }

    // 2. Create ICT Services
    if (mappingResult.services.length > 0 && options.createServices !== false) {
      for (const service of mappingResult.services) {
        // We need a contract first - create a placeholder contract
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert({
            organization_id: existingVendor.organization_id,
            vendor_id: vendorId,
            contract_ref: `SOC2-${mappingResult.documentId.substring(0, 8)}`,
            contract_type: 'service_agreement',
            effective_date: new Date().toISOString().split('T')[0],
            status: 'draft',
            notes: 'Auto-created from SOC2 extraction',
          })
          .select('id')
          .single();

        if (contractError) {
          warnings.push(`Failed to create contract: ${contractError.message}`);
          continue;
        }

        // Create ICT service
        const { data: ictService, error: serviceError } = await supabase
          .from('ict_services')
          .insert({
            contract_id: contract.id,
            vendor_id: vendorId,
            organization_id: existingVendor.organization_id,
            service_name: service.service_name,
            service_type: service.service_type,
            description: service.description,
            system_boundaries: service.system_boundaries,
            infrastructure_components: service.infrastructure_components,
            software_components: service.software_components,
            processes_personal_data: service.stores_data,
            personal_data_categories: service.data_categories,
            source_type: 'soc2_extraction',
            source_document_id: mappingResult.documentId,
          })
          .select('id')
          .single();

        if (serviceError) {
          warnings.push(`Failed to create service: ${serviceError.message}`);
        } else {
          serviceIds.push(ictService.id);
        }
      }
    }

    // 3. Create Subcontractors (fourth parties)
    if (mappingResult.subcontractors.length > 0) {
      // Filter by selected if specified
      const subsToCreate = options.selectedSubcontractors
        ? mappingResult.subcontractors.filter(s =>
            options.selectedSubcontractors!.includes(s.subcontractor_name)
          )
        : mappingResult.subcontractors;

      for (const sub of subsToCreate) {
        const { data: subcontractor, error: subError } = await supabase
          .from('subcontractors')
          .insert({
            vendor_id: vendorId,
            organization_id: existingVendor.organization_id,
            subcontractor_name: sub.subcontractor_name,
            service_description: sub.service_description,
            tier_level: sub.tier_level,
            is_direct_subcontractor: sub.is_direct_subcontractor,
            source_type: 'soc2_extraction',
            source_document_id: mappingResult.documentId,
            inclusion_method: sub.inclusion_method,
            controls_supported: sub.controls_supported,
            has_own_soc2: sub.has_own_soc2,
            soc2_location_reference: sub.soc2_location_reference,
            service_type: sub.service_type,
          })
          .select('id')
          .single();

        if (subError) {
          warnings.push(`Failed to create subcontractor ${sub.subcontractor_name}: ${subError.message}`);
        } else {
          subcontractorIds.push(subcontractor.id);
        }
      }
    }

    // 4. Create the mapping record
    const mappingRecord: Soc2RoiMappingRecord = {
      organization_id: existingVendor.organization_id,
      parsed_soc2_id: mappingResult.parsedSoc2Id,
      document_id: mappingResult.documentId,
      extracted_vendor_id: vendorId,
      extracted_service_ids: serviceIds,
      extracted_subcontractor_ids: subcontractorIds,
      extraction_status: errors.length > 0 ? 'partial' : 'completed',
      extraction_confidence: mappingResult.confidenceScores.overall,
      extraction_details: mappingResult.details,
      extracted_at: new Date().toISOString(),
      error_message: errors.length > 0 ? errors.join('; ') : null,
      is_confirmed: false,
    };

    const { data: insertedMapping, error: mappingError } = await supabase
      .from('soc2_roi_mappings')
      .upsert(mappingRecord, { onConflict: 'organization_id,parsed_soc2_id' })
      .select('id')
      .single();

    if (mappingError) {
      errors.push(`Failed to save mapping: ${mappingError.message}`);
    }

    return {
      success: errors.length === 0,
      mappingId: insertedMapping?.id,
      vendorId,
      vendorUpdated,
      serviceIds,
      subcontractorIds,
      confidence: mappingResult.confidenceScores.overall,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
