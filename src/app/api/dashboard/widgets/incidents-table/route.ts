import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const sortField = searchParams.get('sort') || 'created_at';
    const sortDir = searchParams.get('dir') === 'asc' ? true : false;

    // Map frontend sort fields to database columns
    const sortColumn =
      sortField === 'reference_number'
        ? 'reference_number'
        : sortField === 'severity'
          ? 'severity'
          : 'created_at';

    // Get incidents
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('id, reference_number, title, severity, status, created_at')
      .eq('organization_id', userData.organization_id)
      .order(sortColumn, { ascending: sortDir })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      incidents: incidents || [],
    });
  } catch (error) {
    console.error('Error fetching incidents table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
