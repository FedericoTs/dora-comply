/**
 * SOC 2 Document Parsing API Route
 *
 * POST /api/documents/[id]/parse-soc2
 *
 * Triggers AI parsing of a SOC 2 report document and stores results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { parseSOC2Report, calculateDORACoverageScore } from '@/lib/ai/parsers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const startTime = Date.now();
  const { id: documentId } = await params;

  try {
    // Get authenticated Supabase client
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, filename, storage_path, mime_type, type, vendor_id, organization_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('[parse-soc2] Document query error:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify document is a SOC 2 report
    if (document.type !== 'soc2') {
      return NextResponse.json(
        { error: 'Document is not a SOC 2 report' },
        { status: 400 }
      );
    }

    // Check if already parsed
    const { data: existingParsed } = await supabase
      .from('parsed_soc2')
      .select('id, created_at')
      .eq('document_id', documentId)
      .single();

    if (existingParsed) {
      return NextResponse.json(
        {
          error: 'Document already parsed',
          parsedId: existingParsed.id,
          parsedAt: existingParsed.created_at,
        },
        { status: 409 }
      );
    }

    // Download PDF from storage using service role client (bypasses RLS)
    const storageClient = createServiceRoleClient();
    const { data: fileData, error: downloadError } = await storageClient.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      console.error('[parse-soc2] Download error:', downloadError);
      console.error('[parse-soc2] Storage path:', document.storage_path);
      return NextResponse.json(
        { error: 'Failed to download document' },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log(`[parse-soc2] Starting AI parsing for document ${documentId}`);
    console.log(`[parse-soc2] PDF size: ${pdfBuffer.length} bytes`);

    // Parse with AI
    const parseResult = await parseSOC2Report({
      pdfBuffer,
      documentId,
      verbose: true,
    });

    if (!parseResult.success || !parseResult.data || !parseResult.databaseRecord) {
      console.error('[parse-soc2] Parse error:', parseResult.error);
      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse document' },
        { status: 500 }
      );
    }

    const { data: parsedData, databaseRecord, doraMapping } = parseResult;

    // Store parsed data in database
    const { data: insertedRecord, error: insertError } = await supabase
      .from('parsed_soc2')
      .insert({
        document_id: documentId,
        report_type: databaseRecord.report_type,
        audit_firm: databaseRecord.audit_firm,
        opinion: databaseRecord.opinion,
        period_start: databaseRecord.period_start,
        period_end: databaseRecord.period_end,
        criteria: databaseRecord.criteria,
        system_description: databaseRecord.system_description,
        controls: databaseRecord.controls,
        exceptions: databaseRecord.exceptions,
        subservice_orgs: databaseRecord.subservice_orgs,
        cuecs: databaseRecord.cuecs,
        raw_extraction: databaseRecord.raw_extraction,
        confidence_scores: databaseRecord.confidence_scores,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[parse-soc2] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store parsed data' },
        { status: 500 }
      );
    }

    // Populate evidence_locations table for traceability
    await populateEvidenceLocations(
      supabase,
      document.organization_id,
      documentId,
      databaseRecord
    );

    // Calculate DORA coverage if we have mappings
    let doraCoverage = null;
    if (doraMapping && doraMapping.length > 0) {
      doraCoverage = calculateDORACoverageScore(doraMapping);
    }

    // Update document to mark as parsed
    await supabase
      .from('documents')
      .update({
        ai_analysis: {
          parsed: true,
          parsedAt: new Date().toISOString(),
          parsedId: insertedRecord.id,
          parserVersion: parsedData.parserVersion,
          processingTimeMs: parsedData.processingTimeMs,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // If vendor_id exists, create/update vendor control assessments
    if (document.vendor_id && doraMapping) {
      await createVendorAssessments(
        supabase,
        document.vendor_id,
        document.organization_id,
        documentId,
        doraMapping
      );
    }

    const totalTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      parsedId: insertedRecord.id,
      summary: {
        reportType: parsedData.reportType,
        auditFirm: parsedData.auditFirm,
        opinion: parsedData.opinion,
        periodStart: parsedData.periodStart,
        periodEnd: parsedData.periodEnd,
        trustServicesCriteria: parsedData.trustServicesCriteria,
        totalControls: parsedData.totalControls,
        controlsOperatingEffectively: parsedData.controlsOperatingEffectively,
        controlsWithExceptions: parsedData.controlsWithExceptions,
        exceptionsCount: parsedData.exceptions.length,
        subserviceOrgsCount: parsedData.subserviceOrgs.length,
        cuecsCount: parsedData.cuecs.length,
        confidenceOverall: parsedData.confidenceScores.overall,
        doraCoverage,
      },
      processingTimeMs: totalTimeMs,
    });
  } catch (error) {
    console.error('[parse-soc2] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper: Create vendor control assessments from DORA mappings
// ============================================================================

async function createVendorAssessments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vendorId: string,
  organizationId: string,
  documentId: string,
  doraMapping: Array<{
    doraArticle: string;
    doraControlId: string;
    coverageLevel: 'full' | 'partial' | 'none';
    confidence: number;
    soc2ControlId: string;
  }>
): Promise<void> {
  try {
    // Get DORA framework ID
    const { data: doraFramework } = await supabase
      .from('frameworks')
      .select('id')
      .eq('code', 'dora')
      .single();

    if (!doraFramework) {
      console.log('[parse-soc2] DORA framework not found, skipping assessments');
      return;
    }

    // Get framework controls
    const { data: frameworkControls } = await supabase
      .from('framework_controls')
      .select('id, control_id')
      .eq('framework_id', doraFramework.id);

    if (!frameworkControls || frameworkControls.length === 0) {
      console.log('[parse-soc2] No DORA controls found, skipping assessments');
      return;
    }

    // Create control ID lookup
    const controlLookup = new Map(
      frameworkControls.map((c) => [c.control_id, c.id])
    );

    // Group mappings by DORA article and get best coverage
    const articleCoverage = new Map<
      string,
      { coverage: string; confidence: number; evidence: string }
    >();

    for (const mapping of doraMapping) {
      const existing = articleCoverage.get(mapping.doraArticle);
      const coverageRank = { full: 3, partial: 2, none: 1 };

      if (
        !existing ||
        coverageRank[mapping.coverageLevel] >
          coverageRank[existing.coverage as keyof typeof coverageRank]
      ) {
        articleCoverage.set(mapping.doraArticle, {
          coverage: mapping.coverageLevel,
          confidence: mapping.confidence,
          evidence: mapping.soc2ControlId,
        });
      }
    }

    // Create assessments
    const assessments = [];
    for (const [article, data] of articleCoverage) {
      const controlId = controlLookup.get(article);
      if (!controlId) continue;

      assessments.push({
        vendor_id: vendorId,
        control_id: controlId,
        organization_id: organizationId,
        status:
          data.coverage === 'full'
            ? 'met'
            : data.coverage === 'partial'
              ? 'partially_met'
              : 'not_met',
        evidence_document_id: documentId,
        evidence_notes: `SOC 2 control ${data.evidence} provides ${data.coverage} coverage`,
        confidence: data.confidence,
        assessment_source: 'ai_parsed',
        valid_from: new Date().toISOString().split('T')[0],
        is_current: true,
      });
    }

    if (assessments.length > 0) {
      const { error: assessmentError } = await supabase
        .from('vendor_control_assessments')
        .upsert(assessments, {
          onConflict: 'vendor_id,control_id,organization_id,valid_from',
        });

      if (assessmentError) {
        console.error('[parse-soc2] Assessment insert error:', assessmentError);
      } else {
        console.log(
          `[parse-soc2] Created ${assessments.length} vendor assessments`
        );
      }
    }
  } catch (error) {
    console.error('[parse-soc2] Error creating assessments:', error);
  }
}

// ============================================================================
// Helper: Populate evidence_locations table for traceability
// ============================================================================

interface ParsedDatabaseRecord {
  controls: Array<{
    controlId: string;
    controlArea?: string;
    tscCategory?: string;
    description: string;
    testResult: string;
    location?: string;
    confidence: number;
  }>;
  exceptions: Array<{
    controlId: string;
    controlArea?: string;
    exceptionDescription: string;
    location?: string;
  }>;
  subservice_orgs: Array<{
    name: string;
    serviceDescription: string;
    location?: string;
  }>;
  cuecs: Array<{
    id?: string;
    description: string;
    customerResponsibility: string;
    location?: string;
  }>;
}

function parseLocation(location?: string): { pageNumber?: number; sectionReference?: string } {
  if (!location) return {};

  // Parse patterns like "Page 26, Section 4.1" or "p. 42" or "Section 3"
  const pageMatch = location.match(/(?:page|p\.?)\s*(\d+)/i);
  const sectionMatch = location.match(/(?:section|sec\.?)\s*([\d.]+)/i);

  return {
    pageNumber: pageMatch ? parseInt(pageMatch[1], 10) : undefined,
    sectionReference: sectionMatch ? `Section ${sectionMatch[1]}` : undefined,
  };
}

async function populateEvidenceLocations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  documentId: string,
  databaseRecord: ParsedDatabaseRecord
): Promise<void> {
  try {
    const evidenceLocations: Array<{
      organization_id: string;
      source_document_id: string;
      evidence_type: string;
      evidence_id: string;
      page_number?: number;
      section_reference?: string;
      extracted_text: string;
      confidence: number;
      extraction_method: string;
    }> = [];

    // Add controls
    for (const control of databaseRecord.controls || []) {
      const { pageNumber, sectionReference } = parseLocation(control.location);
      evidenceLocations.push({
        organization_id: organizationId,
        source_document_id: documentId,
        evidence_type: 'control',
        evidence_id: control.controlId,
        page_number: pageNumber,
        section_reference: sectionReference || control.controlArea,
        extracted_text: control.description.substring(0, 2000), // Limit text length
        confidence: control.confidence,
        extraction_method: 'ai',
      });
    }

    // Add exceptions
    for (const exception of databaseRecord.exceptions || []) {
      const { pageNumber, sectionReference } = parseLocation(exception.location);
      evidenceLocations.push({
        organization_id: organizationId,
        source_document_id: documentId,
        evidence_type: 'exception',
        evidence_id: exception.controlId,
        page_number: pageNumber,
        section_reference: sectionReference || exception.controlArea,
        extracted_text: exception.exceptionDescription.substring(0, 2000),
        confidence: 0.85, // Exceptions typically high confidence
        extraction_method: 'ai',
      });
    }

    // Add subservice organizations
    for (let i = 0; i < (databaseRecord.subservice_orgs || []).length; i++) {
      const org = databaseRecord.subservice_orgs[i];
      const { pageNumber, sectionReference } = parseLocation(org.location);
      evidenceLocations.push({
        organization_id: organizationId,
        source_document_id: documentId,
        evidence_type: 'subservice',
        evidence_id: `subservice-${i}`,
        page_number: pageNumber,
        section_reference: sectionReference,
        extracted_text: `${org.name}: ${org.serviceDescription}`.substring(0, 2000),
        confidence: 0.9,
        extraction_method: 'ai',
      });
    }

    // Add CUECs
    for (let i = 0; i < (databaseRecord.cuecs || []).length; i++) {
      const cuec = databaseRecord.cuecs[i];
      const { pageNumber, sectionReference } = parseLocation(cuec.location);
      evidenceLocations.push({
        organization_id: organizationId,
        source_document_id: documentId,
        evidence_type: 'cuec',
        evidence_id: cuec.id || `CUEC-${i + 1}`,
        page_number: pageNumber,
        section_reference: sectionReference,
        extracted_text: cuec.customerResponsibility.substring(0, 2000),
        confidence: 0.88,
        extraction_method: 'ai',
      });
    }

    if (evidenceLocations.length > 0) {
      const { error: evidenceError } = await supabase
        .from('evidence_locations')
        .insert(evidenceLocations);

      if (evidenceError) {
        console.error('[parse-soc2] Evidence locations insert error:', evidenceError);
      } else {
        console.log(
          `[parse-soc2] Created ${evidenceLocations.length} evidence location records`
        );
      }
    }
  } catch (error) {
    console.error('[parse-soc2] Error populating evidence locations:', error);
  }
}
