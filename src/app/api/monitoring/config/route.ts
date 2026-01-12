/**
 * GET /api/monitoring/config
 *
 * Check if SecurityScorecard API is configured and return provider info.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/external/securityscorecard';

export async function GET() {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const configured = isConfigured();

  return NextResponse.json({
    configured,
    provider: 'SecurityScorecard',
    features: configured
      ? [
          'Company lookup by domain',
          'Security score (0-100)',
          'Letter grade (A-F)',
          '10 risk factor breakdown',
          'Historical score trending',
          'Issue tracking',
        ]
      : [],
    signupUrl: 'https://securityscorecard.com/platform/pricing/',
    documentation: 'https://securityscorecard.readme.io/',
    description: configured
      ? 'SecurityScorecard integration is active. You can enable monitoring for vendors.'
      : 'SecurityScorecard API key not configured. Add SECURITYSCORECARD_API_KEY to environment variables.',
  });
}
