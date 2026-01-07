/**
 * Document Auto-Link API Route
 *
 * POST /api/documents/[id]/auto-link
 *
 * Triggers auto-linking of subservice organizations from a parsed SOC 2 report
 * to the subcontractors table for fourth-party supply chain visibility.
 *
 * Use cases:
 * 1. Called by frontend after Modal parsing completes
 * 2. Manual trigger to re-link a document
 * 3. Part of bulk re-linking operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autoLinkSubserviceOrgs } from '@/lib/ai/parsers/subservice-linker';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
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

    // Verify document exists and user has access (RLS will enforce)
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, vendor_id, type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify it's a SOC 2 document
    if (document.type !== 'soc2') {
      return NextResponse.json(
        { error: 'Only SOC 2 documents support auto-linking' },
        { status: 400 }
      );
    }

    // Check if document has been parsed
    const { data: parsed } = await supabase
      .from('parsed_soc2')
      .select('id, subservice_orgs')
      .eq('document_id', documentId)
      .single();

    if (!parsed) {
      return NextResponse.json(
        { error: 'Document has not been parsed yet' },
        { status: 400 }
      );
    }

    // Perform auto-linking
    const result = await autoLinkSubserviceOrgs(documentId);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors[0],
          errors: result.errors,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${result.created} new subcontractors, updated ${result.updated}, skipped ${result.skipped}`,
      documentId: result.documentId,
      vendorId: result.vendorId,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      subcontractors: result.subcontractors,
    });
  } catch (error) {
    console.error('[auto-link] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if auto-linking is needed
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: documentId } = await params;

  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check parsed data
    const { data: parsed } = await supabase
      .from('parsed_soc2')
      .select('id, subservice_orgs')
      .eq('document_id', documentId)
      .single();

    if (!parsed) {
      return NextResponse.json({
        parsed: false,
        canAutoLink: false,
        subserviceOrgCount: 0,
      });
    }

    const subserviceOrgs = parsed.subservice_orgs as unknown[] | null;
    const orgCount = Array.isArray(subserviceOrgs) ? subserviceOrgs.length : 0;

    // Check existing linked subcontractors
    const { data: document } = await supabase
      .from('documents')
      .select('vendor_id')
      .eq('id', documentId)
      .single();

    let linkedCount = 0;
    if (document?.vendor_id) {
      const { count } = await supabase
        .from('subcontractors')
        .select('id', { count: 'exact', head: true })
        .eq('source_document_id', documentId)
        .is('deleted_at', null);

      linkedCount = count || 0;
    }

    return NextResponse.json({
      parsed: true,
      canAutoLink: orgCount > 0,
      subserviceOrgCount: orgCount,
      linkedSubcontractorCount: linkedCount,
      needsLinking: orgCount > linkedCount,
    });
  } catch (error) {
    console.error('[auto-link] Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
