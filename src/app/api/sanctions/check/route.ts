/**
 * Sanctions Check API
 *
 * POST /api/sanctions/check - Run sanctions screening for an entity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkSanctions,
  isSanctionsError,
  isApiKeyConfigured,
} from '@/lib/external/opensanctions';

export async function POST(request: NextRequest) {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if API key is configured
  if (!isApiKeyConfigured()) {
    return NextResponse.json({
      error: true,
      message: 'Sanctions screening is not configured. Add OPENSANCTIONS_API_KEY to your environment variables.',
      code: 'NOT_CONFIGURED',
    });
  }

  try {
    const body = await request.json();
    const { name, country } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Entity name is required' },
        { status: 400 }
      );
    }

    // Run sanctions check
    const result = await checkSanctions(name.trim(), country);

    if (isSanctionsError(result)) {
      return NextResponse.json(result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Sanctions Check] Error:', error);
    return NextResponse.json(
      { error: true, message: 'An unexpected error occurred', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
