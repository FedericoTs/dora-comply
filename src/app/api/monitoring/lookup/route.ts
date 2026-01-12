/**
 * GET /api/monitoring/lookup?domain=example.com
 *
 * Lookup a company's security scorecard by domain.
 * Returns score, grade, and factor breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isConfigured,
  isValidDomain,
  getScorecardOrMock,
  lookupCompany,
} from '@/lib/external/securityscorecard';

export async function GET(request: NextRequest) {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  // Validate domain parameter
  if (!domain) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_DOMAIN',
          message: 'Domain parameter is required',
        },
      },
      { status: 400 }
    );
  }

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid domain format. Example: example.com',
        },
      },
      { status: 400 }
    );
  }

  try {
    // Check if API is configured
    const apiConfigured = isConfigured();

    // Get scorecard (will use mock if not configured)
    const scorecard = await getScorecardOrMock(domain);

    if (!scorecard) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `No scorecard found for domain: ${domain}`,
          },
        },
        { status: 404 }
      );
    }

    // Get additional company info if API is configured
    let company = null;
    if (apiConfigured) {
      company = await lookupCompany(domain);
    }

    return NextResponse.json({
      success: true,
      mock: !apiConfigured,
      data: {
        scorecard,
        company,
      },
    });
  } catch (error) {
    console.error('[Monitoring Lookup] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'LOOKUP_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to lookup domain',
        },
      },
      { status: 500 }
    );
  }
}
