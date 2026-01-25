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
    const framework = searchParams.get('framework') || 'nis2';

    // Get organization's compliance data
    const { data: org } = await supabase
      .from('organizations')
      .select('compliance_score, enabled_frameworks')
      .eq('id', userData.organization_id)
      .single();

    // Get framework-specific compliance if available
    const { data: frameworkCompliance } = await supabase
      .from('vendor_framework_compliance')
      .select('compliance_score, pillar_scores')
      .eq('organization_id', userData.organization_id)
      .eq('framework', framework)
      .maybeSingle();

    // Use real data if available, otherwise generate sample
    const score = frameworkCompliance?.compliance_score ?? org?.compliance_score ?? 65;

    // Generate pillar data based on framework
    const pillars = getPillarData(framework, frameworkCompliance?.pillar_scores);

    return NextResponse.json({
      score: Math.round(score),
      framework,
      pillars,
    });
  } catch (error) {
    console.error('Error fetching compliance gauge data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getPillarData(framework: string, savedScores?: Record<string, number>) {
  const pillarConfigs: Record<string, { id: string; name: string }[]> = {
    nis2: [
      { id: 'governance', name: 'Governance' },
      { id: 'risk-management', name: 'Risk Management' },
      { id: 'incident-handling', name: 'Incident Handling' },
      { id: 'supply-chain', name: 'Supply Chain' },
      { id: 'business-continuity', name: 'Business Continuity' },
    ],
    dora: [
      { id: 'ict-risk', name: 'ICT Risk Mgmt' },
      { id: 'incident', name: 'Incident Mgmt' },
      { id: 'testing', name: 'Resilience Testing' },
      { id: 'tprm', name: 'TPRM' },
      { id: 'info-sharing', name: 'Info Sharing' },
    ],
    gdpr: [
      { id: 'lawfulness', name: 'Lawfulness' },
      { id: 'rights', name: 'Data Subject Rights' },
      { id: 'security', name: 'Security' },
      { id: 'accountability', name: 'Accountability' },
    ],
    iso27001: [
      { id: 'context', name: 'Context' },
      { id: 'leadership', name: 'Leadership' },
      { id: 'planning', name: 'Planning' },
      { id: 'support', name: 'Support' },
      { id: 'operation', name: 'Operation' },
    ],
  };

  const config = pillarConfigs[framework] || pillarConfigs.nis2;

  return config.map((pillar) => ({
    id: pillar.id,
    name: pillar.name,
    score: savedScores?.[pillar.id] ?? Math.floor(Math.random() * 40) + 40,
  }));
}
