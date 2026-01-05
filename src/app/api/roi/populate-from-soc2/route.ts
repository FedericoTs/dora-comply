/**
 * API Route: Populate RoI from SOC2 Report
 *
 * POST /api/roi/populate-from-soc2
 * Body: {
 *   documentId: string,
 *   preview?: boolean,
 *   options?: {
 *     createVendor?: boolean,
 *     useExistingVendorId?: string,
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
import type { ParsedSOC2Report } from '@/lib/ai/parsers/types';
import type {
  SOC2ToRoiMappingResult,
  ExtractedVendorData,
  ExtractedServiceData,
  ExtractedSubcontractorData,
  Soc2RoiMappingRecord,
} from '@/lib/roi/soc2-to-roi-types';

interface PopulateOptions {
  createVendor?: boolean;
  useExistingVendorId?: string;
  selectedSubcontractors?: string[];
  createServices?: boolean;
}

interface PopulateResult {
  success: boolean;
  mappingId?: string;
  vendorId?: string;
  vendorCreated?: boolean;
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

    // Generate mapping result
    const mappingResult = mapSOC2ToRoi(report, documentId, profile.organization_id);
    mappingResult.parsedSoc2Id = parsedSoc2.id;

    // Check for existing vendor match
    let existingVendorId: string | undefined;
    if (report.serviceOrgName) {
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .ilike('name', `%${report.serviceOrgName}%`)
        .limit(1)
        .single();

      if (existingVendor) {
        existingVendorId = existingVendor.id;
      }
    }

    // Generate preview
    const preview = generatePopulationPreview(mappingResult, existingVendorId);

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

    // Generate mapping result
    const mappingResult = mapSOC2ToRoi(report, documentId, organizationId);
    mappingResult.parsedSoc2Id = parsedSoc2.id;

    // Preview mode
    if (preview) {
      const previewData = generatePopulationPreview(mappingResult, options.useExistingVendorId);
      return NextResponse.json({ preview: previewData });
    }

    // Actual population
    const result = await populateRoiData(
      supabase,
      mappingResult,
      organizationId,
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

  return {
    reportType: (dbRecord.report_type as 'type1' | 'type2') || 'type2',
    auditFirm: (rawExtraction?.auditFirm as string) || '',
    opinion: (rawExtraction?.opinion as 'unqualified' | 'qualified' | 'adverse') || 'unqualified',
    periodStart: (rawExtraction?.periodStart as string) || '',
    periodEnd: (rawExtraction?.periodEnd as string) || '',
    reportDate: (rawExtraction?.reportDate as string) || '',
    serviceOrgName: (rawExtraction?.serviceOrgName as string) || '',
    serviceOrgDescription: (rawExtraction?.serviceOrgDescription as string) || '',
    trustServicesCriteria: (rawExtraction?.trustServicesCriteria as ParsedSOC2Report['trustServicesCriteria']) || [],
    systemDescription: (rawExtraction?.systemDescription as string) || '',
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
  organizationId: string,
  userId: string,
  options: PopulateOptions
): Promise<PopulateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let vendorId: string | undefined;
  let vendorCreated = false;
  const serviceIds: string[] = [];
  const subcontractorIds: string[] = [];

  try {
    // 1. Handle Vendor
    if (mappingResult.vendor) {
      if (options.useExistingVendorId) {
        vendorId = options.useExistingVendorId;
        vendorCreated = false;

        // Update existing vendor with SOC2 data
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            last_soc2_audit_firm: mappingResult.vendor.last_soc2_audit_firm,
            last_soc2_audit_date: mappingResult.vendor.last_soc2_audit_date,
            soc2_report_type: mappingResult.vendor.soc2_report_type,
            soc2_opinion: mappingResult.vendor.soc2_opinion,
            source_document_id: mappingResult.documentId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId);

        if (updateError) {
          warnings.push(`Failed to update vendor: ${updateError.message}`);
        }
      } else if (options.createVendor !== false) {
        // Create new vendor
        const { data: newVendor, error: createError } = await supabase
          .from('vendors')
          .insert({
            organization_id: organizationId,
            name: mappingResult.vendor.name,
            description: mappingResult.vendor.description,
            source_type: 'soc2_extraction',
            source_document_id: mappingResult.documentId,
            last_soc2_audit_firm: mappingResult.vendor.last_soc2_audit_firm,
            last_soc2_audit_date: mappingResult.vendor.last_soc2_audit_date,
            soc2_report_type: mappingResult.vendor.soc2_report_type,
            soc2_opinion: mappingResult.vendor.soc2_opinion,
            risk_level: 'medium', // Default
            status: 'active',
          })
          .select('id')
          .single();

        if (createError) {
          errors.push(`Failed to create vendor: ${createError.message}`);
        } else {
          vendorId = newVendor.id;
          vendorCreated = true;
        }
      }
    }

    // 2. Handle Services (if vendor was created/specified)
    if (vendorId && mappingResult.services.length > 0 && options.createServices !== false) {
      for (const service of mappingResult.services) {
        // We need a contract first - create a placeholder contract
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert({
            organization_id: organizationId,
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
            organization_id: organizationId,
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

    // 3. Handle Subcontractors
    if (vendorId && mappingResult.subcontractors.length > 0) {
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
            organization_id: organizationId,
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
      organization_id: organizationId,
      parsed_soc2_id: mappingResult.parsedSoc2Id,
      document_id: mappingResult.documentId,
      extracted_vendor_id: vendorId || null,
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
      vendorCreated,
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
