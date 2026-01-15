/**
 * Bulk Subcontractor Re-Link API Route
 *
 * POST /api/subcontractors/relink
 *
 * Re-links all parsed SOC 2 subservice organizations to subcontractors table.
 * Useful for backfilling fourth-party data from existing documents.
 *
 * Request body:
 *   { force?: boolean } - If true, re-processes all documents even if already linked
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { relinkAllDocuments } from '@/lib/ai/parsers/subservice-linker';

export async function POST(): Promise<NextResponse> {
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

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 400 }
      );
    }

    // Perform bulk re-linking
    const result = await relinkAllDocuments(profile.organization_id);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some documents failed to link',
          errors: result.errors,
          processed: result.processed,
          totalCreated: result.totalCreated,
          totalUpdated: result.totalUpdated,
          totalSkipped: result.totalSkipped,
        },
        { status: 207 } // Multi-Status - partial success
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} documents: ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalSkipped} skipped`,
      processed: result.processed,
      totalCreated: result.totalCreated,
      totalUpdated: result.totalUpdated,
      totalSkipped: result.totalSkipped,
    });
  } catch (error) {
    console.error('[relink] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check status of what can be re-linked
export async function GET(): Promise<NextResponse> {
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

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 });
    }

    // Count documents with parsed SOC 2 data that have subservice orgs
    const { data: parsedDocs, error: queryError } = await supabase
      .from('parsed_soc2')
      .select(`
        document_id,
        subservice_orgs,
        documents!inner (
          id,
          vendor_id,
          organization_id
        )
      `)
      .not('subservice_orgs', 'is', null)
      .eq('documents.organization_id', profile.organization_id);

    if (queryError) {
      console.error('[relink] Query error:', queryError);
      return NextResponse.json({ error: 'Failed to query documents' }, { status: 500 });
    }

    // Count total subservice orgs and existing subcontractors
    let totalSubserviceOrgs = 0;
    const documentIds: string[] = [];

    for (const doc of parsedDocs || []) {
      const orgs = doc.subservice_orgs as unknown[] | null;
      if (Array.isArray(orgs)) {
        totalSubserviceOrgs += orgs.length;
        documentIds.push(doc.document_id);
      }
    }

    // Count existing linked subcontractors
    let existingLinked = 0;
    if (documentIds.length > 0) {
      const { count } = await supabase
        .from('subcontractors')
        .select('id', { count: 'exact', head: true })
        .in('source_document_id', documentIds)
        .is('deleted_at', null);

      existingLinked = count || 0;
    }

    return NextResponse.json({
      documentsWithSubserviceOrgs: parsedDocs?.length || 0,
      totalSubserviceOrgs,
      existingLinkedSubcontractors: existingLinked,
      potentialNewLinks: Math.max(0, totalSubserviceOrgs - existingLinked),
      canRelink: (parsedDocs?.length || 0) > 0,
    });
  } catch (error) {
    console.error('[relink] Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
