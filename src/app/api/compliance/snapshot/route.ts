/**
 * Maturity Snapshot API Route
 *
 * POST /api/compliance/snapshot
 *
 * Creates a maturity snapshot. Can be called:
 * - Manually from the UI
 * - Automatically after SOC 2 parsing completes
 * - Via webhook from external systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  triggerSoc2UploadSnapshot,
  triggerAssessmentSnapshot,
  triggerRemediationSnapshot,
  createBaselineSnapshot,
} from '@/lib/compliance/auto-snapshot';
import { createMaturitySnapshot } from '@/lib/compliance/maturity-history';
import type { SnapshotType } from '@/lib/compliance/maturity-history-types';

interface SnapshotRequest {
  type: SnapshotType;
  vendorId?: string;
  notes?: string;
  documentId?: string; // For SOC 2 uploads, to associate snapshot with document
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    const body = await request.json() as SnapshotRequest;
    const { type, vendorId, notes, documentId } = body;

    // Validate type
    const validTypes: SnapshotType[] = [
      'scheduled',
      'manual',
      'soc2_upload',
      'assessment',
      'remediation',
      'baseline',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid snapshot type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Route to appropriate handler based on type
    let result;

    switch (type) {
      case 'soc2_upload':
        result = await triggerSoc2UploadSnapshot(vendorId);
        break;
      case 'assessment':
        result = await triggerAssessmentSnapshot(vendorId);
        break;
      case 'remediation':
        result = await triggerRemediationSnapshot(vendorId);
        break;
      case 'baseline':
        result = await createBaselineSnapshot(vendorId);
        break;
      case 'manual':
      case 'scheduled':
      default:
        result = await createMaturitySnapshot(type, vendorId, notes);
        // Convert to AutoSnapshotResult format
        result = {
          success: result.success,
          snapshotId: result.data?.id,
          reason: result.error,
        };
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.reason || 'Failed to create snapshot',
          skipped: result.skipped,
        },
        { status: result.skipped ? 200 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshotId: result.snapshotId,
      skipped: result.skipped || false,
      message: result.skipped
        ? `Snapshot skipped: ${result.reason}`
        : 'Snapshot created successfully',
    });
  } catch (error) {
    console.error('[snapshot] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/compliance/snapshot
 *
 * Get the latest snapshot or snapshot history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
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

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const latest = searchParams.get('latest') === 'true';

    let query = supabase
      .from('maturity_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    } else {
      query = query.is('vendor_id', null);
    }

    if (latest) {
      query = query.limit(1);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (latest) {
      return NextResponse.json({
        snapshot: data?.[0] || null,
      });
    }

    return NextResponse.json({
      snapshots: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[snapshot] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
