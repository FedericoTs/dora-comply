/**
 * Activity Log Export API
 *
 * Exports audit trail as CSV for compliance reporting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportAuditTrailCsv, type AuditTrailFilters, type AuditEntityType } from '@/lib/activity/queries';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Build filters from query params
    const filters: AuditTrailFilters = {};

    const entityType = searchParams.get('entityType');
    if (entityType) {
      filters.entityType = entityType as AuditEntityType;
    }

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Generate CSV
    const csv = await exportAuditTrailCsv(filters);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-trail-${timestamp}.csv`;

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Activity Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export activity log' },
      { status: 500 }
    );
  }
}
