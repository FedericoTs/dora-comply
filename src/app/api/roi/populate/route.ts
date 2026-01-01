/**
 * API Route: Populate RoI from AI Analysis
 *
 * POST /api/roi/populate
 * Body: { documentId: string, options?: { createVendor?: boolean, useExistingVendorId?: string } }
 *
 * Returns populated contract ID and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  populateRoiFromAnalysis,
  previewRoiPopulation,
} from '@/lib/roi/ai-pipeline';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentId, options, preview } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Preview mode - just show what would be populated
    if (preview) {
      const previewResult = await previewRoiPopulation(documentId);
      return NextResponse.json(previewResult);
    }

    // Actually populate the RoI
    const result = await populateRoiFromAnalysis(documentId, options || {});

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors[0] || 'Failed to populate RoI', errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      contractId: result.contractId,
      vendorUpdated: result.vendorUpdated,
      servicesCreated: result.servicesCreated,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('[API] RoI populate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId query parameter is required' },
        { status: 400 }
      );
    }

    // Return preview
    const previewResult = await previewRoiPopulation(documentId);
    return NextResponse.json(previewResult);
  } catch (error) {
    console.error('[API] RoI populate preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
