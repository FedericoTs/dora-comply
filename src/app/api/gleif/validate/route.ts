/**
 * GLEIF LEI Validation API
 *
 * GET: Validate an LEI and return enriched entity data
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateLEIEnriched } from '@/lib/external/gleif';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lei = searchParams.get('lei');

    if (!lei) {
      return NextResponse.json(
        { valid: false, error: 'LEI parameter is required' },
        { status: 400 }
      );
    }

    // Normalize LEI
    const normalizedLEI = lei.toUpperCase().trim();

    // Format check
    if (!/^[A-Z0-9]{20}$/.test(normalizedLEI)) {
      return NextResponse.json({
        valid: false,
        error: 'LEI must be exactly 20 alphanumeric characters',
      });
    }

    // Validate using GLEIF API
    const result = await validateLEIEnriched(normalizedLEI);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GLEIF validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate LEI' },
      { status: 500 }
    );
  }
}
