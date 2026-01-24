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

    // Get pending tasks from remediation_actions
    const { data: actions, error } = await supabase
      .from('remediation_actions')
      .select('id, title, priority, due_date, plan_id, remediation_plans!inner(organization_id)')
      .eq('remediation_plans.organization_id', userData.organization_id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      tasks: (actions || []).map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        due_date: a.due_date,
        plan_id: a.plan_id,
      })),
    });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
