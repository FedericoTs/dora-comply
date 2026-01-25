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

    // Get organization's enabled frameworks
    const { data: org } = await supabase
      .from('organizations')
      .select('enabled_frameworks')
      .eq('id', userData.organization_id)
      .single();

    const enabledFrameworks = org?.enabled_frameworks || ['nis2'];

    // Get compliance scores for each framework
    const { data: frameworkScores } = await supabase
      .from('vendor_framework_compliance')
      .select('framework, compliance_score')
      .eq('organization_id', userData.organization_id)
      .in('framework', enabledFrameworks);

    // Build framework status array
    const frameworkConfig: Record<string, { name: string; defaultScore: number; defaultGaps: number }> = {
      nis2: { name: 'NIS2', defaultScore: 72, defaultGaps: 3 },
      dora: { name: 'DORA', defaultScore: 58, defaultGaps: 5 },
      gdpr: { name: 'GDPR', defaultScore: 85, defaultGaps: 1 },
      iso27001: { name: 'ISO 27001', defaultScore: 45, defaultGaps: 8 },
    };

    const scoreMap = new Map(
      (frameworkScores || []).map((f) => [f.framework, f.compliance_score])
    );

    const frameworks = enabledFrameworks.map((code: string) => {
      const config = frameworkConfig[code] || { name: code.toUpperCase(), defaultScore: 50, defaultGaps: 4 };
      const score = scoreMap.get(code) ?? config.defaultScore;
      const criticalGaps = score < 60 ? config.defaultGaps : score < 80 ? Math.floor(config.defaultGaps / 2) : 0;

      return {
        code,
        name: config.name,
        score: Math.round(score),
        criticalGaps,
      };
    });

    const overallScore = frameworks.length > 0
      ? Math.round(frameworks.reduce((sum: number, f: { score: number }) => sum + f.score, 0) / frameworks.length)
      : 0;

    return NextResponse.json({
      frameworks,
      overallScore,
    });
  } catch (error) {
    console.error('Error fetching framework overview data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
