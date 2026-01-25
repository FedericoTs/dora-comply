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

    // Get incidents grouped by status
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('status')
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    const counts = {
      open: 0,
      investigating: 0,
      resolved: 0,
      closed: 0,
    };

    (incidents || []).forEach((incident) => {
      const status = incident.status?.toLowerCase() || 'open';
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      } else if (status === 'in_progress' || status === 'in-progress') {
        counts.investigating++;
      } else {
        counts.open++;
      }
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      ...counts,
      total,
    });
  } catch (error) {
    console.error('Error fetching incidents by status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
