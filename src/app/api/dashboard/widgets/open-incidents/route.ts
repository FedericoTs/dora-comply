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

    // Get open incidents
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('id, title, severity, status, detected_at')
      .eq('organization_id', userData.organization_id)
      .not('status', 'in', '("resolved","closed")')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      incidents: incidents || [],
    });
  } catch (error) {
    console.error('Error fetching open incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
