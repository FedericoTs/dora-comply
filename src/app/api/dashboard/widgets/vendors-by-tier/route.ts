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

    // Get vendors grouped by tier
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('tier')
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null);

    if (error) throw error;

    const counts = {
      critical: 0,
      important: 0,
      standard: 0,
    };

    (vendors || []).forEach((v) => {
      if (v.tier in counts) {
        counts[v.tier as keyof typeof counts]++;
      }
    });

    return NextResponse.json({
      ...counts,
      total: vendors?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching vendors by tier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
