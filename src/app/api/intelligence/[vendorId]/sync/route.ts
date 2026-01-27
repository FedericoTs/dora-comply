/**
 * POST /api/intelligence/[vendorId]/sync
 *
 * Sync intelligence data for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncVendorIntelligence } from '@/lib/intelligence/aggregator';
import { getVendorWithRelations } from '@/lib/vendors/queries';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await context.params;

  try {
    // Get vendor details
    const vendor = await getVendorWithRelations(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Use monitoring domain
    const domain = vendor.monitoring_domain || undefined;

    // Sync intelligence
    const result = await syncVendorIntelligence(vendorId, vendor.name, {
      domain,
      cik: vendor.sec_cik || undefined,
      keywords: vendor.news_keywords || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync vendor intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to sync intelligence data' },
      { status: 500 }
    );
  }
}
