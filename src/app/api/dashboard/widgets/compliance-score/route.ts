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

    // Get the latest compliance score from nis2_compliance_scores
    const { data: scores } = await supabase
      .from('nis2_compliance_scores')
      .select('overall_score')
      .eq('organization_id', userData.organization_id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      score: scores?.overall_score ?? 0,
    });
  } catch (error) {
    console.error('Error fetching compliance score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
