/**
 * GET /api/vendors
 *
 * List vendors for the organization (simple version for selects/dropdowns)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, primary_contact')
      .is('deleted_at', null)
      .order('name')
      .limit(limit);

    if (error) {
      console.error('Failed to fetch vendors:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch vendors',
        },
        { status: 500 }
      );
    }

    // Transform data to include primary_contact_email from JSONB
    const transformedData = (data || []).map((vendor) => {
      const primaryContact = vendor.primary_contact as { email?: string } | null;
      return {
        id: vendor.id,
        name: vendor.name,
        primary_contact_email: primaryContact?.email || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vendors',
      },
      { status: 500 }
    );
  }
}
