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

    // Count vendors
    const { count, error } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null);

    if (error) throw error;

    return NextResponse.json({
      total: count || 0,
      change: 0, // TODO: Calculate 30-day change
    });
  } catch (error) {
    console.error('Error fetching vendors count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
