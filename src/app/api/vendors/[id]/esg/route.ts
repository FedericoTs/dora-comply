/**
 * API Route: Vendor ESG Profile
 *
 * GET /api/vendors/:id/esg - Get complete ESG profile for a vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVendorESGProfile } from '@/lib/esg';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const profile = await getVendorESGProfile(id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching ESG profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESG profile' },
      { status: 500 }
    );
  }
}
