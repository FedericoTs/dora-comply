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

    // Get remediation actions from dora_remediation_actions table
    const { data: actions, error } = await supabase
      .from('dora_remediation_actions')
      .select('status, priority')
      .eq('organization_id', userData.organization_id);

    if (error) throw error;

    // Calculate totals
    const byPriority: Record<string, { completed: number; total: number }> = {
      critical: { completed: 0, total: 0 },
      high: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      low: { completed: 0, total: 0 },
    };

    let totalCompleted = 0;
    let totalActions = 0;

    (actions || []).forEach((action) => {
      const priority = (action.priority || 'medium').toLowerCase();
      const isCompleted = action.status === 'completed';

      totalActions++;
      if (isCompleted) totalCompleted++;

      if (byPriority[priority]) {
        byPriority[priority].total++;
        if (isCompleted) byPriority[priority].completed++;
      } else {
        byPriority.medium.total++;
        if (isCompleted) byPriority.medium.completed++;
      }
    });

    const percentage = totalActions > 0 ? Math.round((totalCompleted / totalActions) * 100) : 0;

    return NextResponse.json({
      completed: totalCompleted,
      total: totalActions,
      percentage,
      byPriority,
    });
  } catch (error) {
    console.error('Error fetching remediation progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
