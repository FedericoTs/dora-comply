/**
 * Sanctions Configuration Check API
 *
 * GET /api/sanctions/config - Check if sanctions screening is configured
 */

import { NextResponse } from 'next/server';
import { isApiKeyConfigured } from '@/lib/external/opensanctions';

export async function GET() {
  return NextResponse.json({
    configured: isApiKeyConfigured(),
    provider: 'OpenSanctions',
    signupUrl: 'https://www.opensanctions.org/api/',
    description: 'Sign up with a business email for a free API key',
  });
}
