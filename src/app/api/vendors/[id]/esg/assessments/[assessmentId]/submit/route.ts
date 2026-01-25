/**
 * API Route: Submit ESG Assessment
 *
 * POST /api/vendors/:id/esg/assessments/:assessmentId/submit - Submit assessment with metric values
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { submitESGAssessment } from '@/lib/esg';

interface RouteParams {
  params: Promise<{ id: string; assessmentId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { assessmentId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const result = await submitESGAssessment(
      {
        assessment_id: assessmentId,
        metric_values: body.metric_values,
        notes: body.notes,
        key_strengths: body.key_strengths,
        improvement_areas: body.improvement_areas,
        external_rating_provider: body.external_rating_provider,
        external_rating: body.external_rating,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting ESG assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit ESG assessment' },
      { status: 500 }
    );
  }
}
