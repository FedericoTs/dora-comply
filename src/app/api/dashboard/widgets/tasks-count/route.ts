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

    // Count tasks from remediation_actions
    const { data: actions, error } = await supabase
      .from('remediation_actions')
      .select('status, remediation_plans!inner(organization_id)')
      .eq('remediation_plans.organization_id', userData.organization_id);

    if (error) throw error;

    const total = actions?.length || 0;
    const completed = actions?.filter((a) => a.status === 'completed').length || 0;
    const pending = total - completed;

    return NextResponse.json({
      total,
      completed,
      pending,
    });
  } catch (error) {
    console.error('Error fetching tasks count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
