/**
 * Certifications API
 *
 * POST /api/certifications - Create a new certification
 * GET /api/certifications - List certifications (with vendor_id filter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: { code: 'NO_ORG', message: 'No organization found' } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      vendor_id,
      standard,
      standard_version,
      certificate_number,
      certification_body,
      accreditation_body,
      valid_from,
      valid_until,
      status = 'valid',
      scope,
      certificate_url,
    } = body;

    // Validate required fields
    if (!vendor_id || !standard || !certification_body || !valid_from) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Insert certification
    const { data, error } = await supabase
      .from('vendor_certifications')
      .insert({
        vendor_id,
        organization_id: profile.organization_id,
        standard,
        standard_version,
        certificate_number,
        certification_body,
        accreditation_body,
        valid_from,
        valid_until,
        status,
        scope,
        certificate_url,
        created_by: user.id,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Certifications API] Insert error:', error);
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Certifications API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create certification' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');

    // Build query
    let query = supabase.from('vendor_certifications').select('*');

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query.order('standard', { ascending: true });

    if (error) {
      console.error('[Certifications API] Query error:', error);
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Certifications API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch certifications' } },
      { status: 500 }
    );
  }
}
