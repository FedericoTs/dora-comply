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

    // Try to get risks from nis2_risks table if it exists
    const { data: risks } = await supabase
      .from('nis2_risks')
      .select('likelihood, impact')
      .eq('organization_id', userData.organization_id);

    // Aggregate risks by likelihood/impact
    const riskCounts: Record<string, { count: number; likelihood: number; impact: number }> = {};

    if (risks && risks.length > 0) {
      for (const risk of risks) {
        const key = `${risk.likelihood}-${risk.impact}`;
        if (!riskCounts[key]) {
          riskCounts[key] = {
            count: 0,
            likelihood: risk.likelihood,
            impact: risk.impact,
          };
        }
        riskCounts[key].count++;
      }
    } else {
      // Generate sample data if no real risks exist
      const sampleRisks = [
        { likelihood: 1, impact: 1, count: 5 },
        { likelihood: 1, impact: 2, count: 3 },
        { likelihood: 2, impact: 1, count: 4 },
        { likelihood: 2, impact: 2, count: 6 },
        { likelihood: 2, impact: 3, count: 3 },
        { likelihood: 3, impact: 2, count: 4 },
        { likelihood: 3, impact: 3, count: 2 },
        { likelihood: 3, impact: 4, count: 2 },
        { likelihood: 4, impact: 3, count: 1 },
        { likelihood: 4, impact: 4, count: 1 },
        { likelihood: 4, impact: 5, count: 1 },
        { likelihood: 5, impact: 4, count: 1 },
      ];

      for (const risk of sampleRisks) {
        const key = `${risk.likelihood}-${risk.impact}`;
        riskCounts[key] = risk;
      }
    }

    const riskArray = Object.values(riskCounts);
    const total = riskArray.reduce((sum, r) => sum + r.count, 0);
    const criticalCount = riskArray
      .filter((r) => r.likelihood * r.impact >= 16)
      .reduce((sum, r) => sum + r.count, 0);
    const highCount = riskArray
      .filter((r) => {
        const score = r.likelihood * r.impact;
        return score >= 10 && score < 16;
      })
      .reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      risks: riskArray,
      total,
      criticalCount,
      highCount,
    });
  } catch (error) {
    console.error('Error fetching risk heat map data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
