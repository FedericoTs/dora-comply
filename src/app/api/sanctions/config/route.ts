/**
 * Sanctions Configuration Check API
 *
 * GET /api/sanctions/config - Check if sanctions screening is configured
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isApiKeyConfigured } from '@/lib/external/opensanctions';

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

  return NextResponse.json({
    configured: isApiKeyConfigured(),
    provider: 'OpenSanctions',
    signupUrl: 'https://www.opensanctions.org/api/',
    description: 'Sign up with a business email for a free API key',
  });
}
