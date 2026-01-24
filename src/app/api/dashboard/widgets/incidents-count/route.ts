import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Count total incidents
    const { count: total } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id);

    // Count open incidents
    const { count: open } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .not('status', 'in', '("resolved","closed")');

    return NextResponse.json({
      total: total || 0,
      open: open || 0,
    });
  } catch (error) {
    console.error('Error fetching incidents count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
