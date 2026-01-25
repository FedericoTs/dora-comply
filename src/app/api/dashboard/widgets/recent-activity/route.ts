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
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

    // Get recent activity from activity_log table
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_name, created_at')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Map activity types
    const mappedActivities = (activities || []).map((activity) => ({
      id: activity.id,
      action: formatActivityTitle(activity.action, activity.entity_type),
      entity_type: activity.entity_type,
      entity_name: activity.entity_name,
      created_at: activity.created_at,
      type: mapActivityType(activity.action),
    }));

    return NextResponse.json({ activities: mappedActivities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatActivityTitle(action: string, entityType: string): string {
  const actionLabels: Record<string, string> = {
    created: 'Added',
    updated: 'Updated',
    deleted: 'Removed',
    approved: 'Approved',
    rejected: 'Rejected',
    submitted: 'Submitted',
    uploaded: 'Uploaded',
    analyzed: 'Analyzed',
  };

  const entityLabels: Record<string, string> = {
    vendor: 'vendor',
    incident: 'incident',
    document: 'document',
    questionnaire: 'questionnaire',
    contract: 'contract',
    user: 'team member',
    roi_entry: 'RoI entry',
  };

  const actionLabel = actionLabels[action] || action;
  const entityLabel = entityLabels[entityType] || entityType;

  return `${actionLabel} ${entityLabel}`;
}

function mapActivityType(action: string): 'success' | 'warning' | 'info' | 'security' {
  if (['created', 'approved', 'submitted'].includes(action)) {
    return 'success';
  }
  if (['deleted', 'rejected'].includes(action)) {
    return 'warning';
  }
  if (['security', 'login', 'logout'].includes(action)) {
    return 'security';
  }
  return 'info';
}
