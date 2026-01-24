import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get high risk vendors (score >= 60)
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, name, risk_score, tier')
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null)
      .gte('risk_score', 60)
      .order('risk_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      vendors: vendors || [],
    });
  } catch (error) {
    console.error('Error fetching high risk vendors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
