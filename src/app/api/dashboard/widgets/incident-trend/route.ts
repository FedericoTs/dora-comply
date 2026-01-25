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
    const range = searchParams.get('range') || 'month';

    // Determine date range
    const now = new Date();
    let monthsBack: number;

    switch (range) {
      case 'week':
        monthsBack = 1;
        break;
      case 'quarter':
        monthsBack = 3;
        break;
      case 'year':
        monthsBack = 12;
        break;
      case 'month':
      default:
        monthsBack = 6;
        break;
    }

    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // Get incidents grouped by month
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('created_at')
      .eq('organization_id', userData.organization_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group incidents by month
    const monthCounts: Record<string, number> = {};

    // Initialize all months with 0
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (monthsBack - 1 - i));
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthCounts[monthKey] = 0;
    }

    // Count incidents
    (incidents || []).forEach((incident) => {
      const date = new Date(incident.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthCounts[monthKey] !== undefined) {
        monthCounts[monthKey]++;
      }
    });

    const trendData = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count,
    }));

    return NextResponse.json({ data: trendData });
  } catch (error) {
    console.error('Error fetching incident trend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
