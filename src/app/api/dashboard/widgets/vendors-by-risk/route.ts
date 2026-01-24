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

    // Get vendors with risk scores
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('risk_score')
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null);

    if (error) throw error;

    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    (vendors || []).forEach((v) => {
      const score = v.risk_score;
      if (score === null || score === undefined) return;
      if (score >= 80) counts.critical++;
      else if (score >= 60) counts.high++;
      else if (score >= 30) counts.medium++;
      else counts.low++;
    });

    return NextResponse.json({
      ...counts,
      total: vendors?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching vendors by risk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
