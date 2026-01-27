/**
 * GET /api/intelligence/[vendorId]
 *
 * Get intelligence data for a specific vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVendorAlerts } from '@/lib/intelligence/queries';
import { getVendorIntelligence } from '@/lib/intelligence/aggregator';
import { checkDomainBreachesOrMock } from '@/lib/external/hibp';
import { searchAndGetFilings } from '@/lib/external/sec-edgar';
import { getVendorWithRelations } from '@/lib/vendors/queries';

export async function GET(
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

    // Get combined intelligence
    const intelligence = await getVendorIntelligence(vendorId, vendor.name);

    // Get breach data if domain available
    let breachData = null;
    if (vendor.monitoring_domain) {
      try {
        breachData = await checkDomainBreachesOrMock(vendor.monitoring_domain);
      } catch {
        // Invalid domain, skip breach check
      }
    }

    // Get SEC filings if available
    let secFilings = null;
    if (vendor.sec_cik) {
      secFilings = await searchAndGetFilings(vendor.name, { limit: 10 });
    }

    return NextResponse.json({
      intelligence,
      breachData,
      secFilings,
    });
  } catch (error) {
    console.error('Get vendor intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to get intelligence data' },
      { status: 500 }
    );
  }
}
