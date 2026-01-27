/**
 * POST /api/intelligence/[vendorId]/keywords
 *
 * Update custom keywords for vendor news monitoring
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
    const { keywords } = body;

    if (!Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'keywords must be an array' },
        { status: 400 }
      );
    }

    // Validate keywords
    const validKeywords = keywords
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k.length < 100);

    const success = await setVendorMonitoring(vendorId, true, validKeywords);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update keywords' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, keywords: validKeywords });
  } catch (error) {
    console.error('Update keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to update keywords' },
      { status: 500 }
    );
  }
}
