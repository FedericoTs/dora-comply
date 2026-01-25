/**
 * API Route: Vendor ESG Assessments
 *
 * GET /api/vendors/:id/esg/assessments - Get all assessments
 * POST /api/vendors/:id/esg/assessments - Create new assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVendorESGAssessments, createESGAssessment } from '@/lib/esg';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const assessments = await getVendorESGAssessments(id);
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching ESG assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESG assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const result = await createESGAssessment(
      {
        vendor_id: id,
        assessment_year: body.assessment_year,
        assessment_period: body.assessment_period,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ assessmentId: result.assessmentId });
  } catch (error) {
    console.error('Error creating ESG assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create ESG assessment' },
      { status: 500 }
    );
  }
}
