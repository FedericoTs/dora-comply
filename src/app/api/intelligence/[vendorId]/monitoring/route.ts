/**
 * POST /api/intelligence/[vendorId]/monitoring
 *
 * Toggle news monitoring for a vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { setVendorMonitoring } from '@/lib/intelligence/queries';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await context.params;

  try {
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    const success = await setVendorMonitoring(vendorId, enabled);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update monitoring status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Toggle monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle monitoring' },
      { status: 500 }
    );
  }
}
