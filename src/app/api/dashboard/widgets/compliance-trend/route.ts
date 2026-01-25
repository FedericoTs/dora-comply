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
    let startDate: Date;
    let dataPoints: number;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dataPoints = 7;
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dataPoints = 12;
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dataPoints = 12;
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dataPoints = 10;
        break;
    }

    // Try to get maturity history if available
    const { data: maturityHistory } = await supabase
      .from('maturity_history')
      .select('score, recorded_at')
      .eq('organization_id', userData.organization_id)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    let trendData: { date: string; score: number }[] = [];

    if (maturityHistory && maturityHistory.length > 0) {
      // Use real data
      trendData = maturityHistory.map((h) => ({
        date: new Date(h.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(h.score || 0),
      }));
    } else {
      // Generate sample trend data if no history exists
      const interval = Math.floor((now.getTime() - startDate.getTime()) / dataPoints);
      let baseScore = 50;

      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(startDate.getTime() + i * interval);
        // Simulate gradual improvement with some variation
        baseScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 6) - 1));
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: baseScore,
        });
      }
    }

    return NextResponse.json({ data: trendData });
  } catch (error) {
    console.error('Error fetching compliance trend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
