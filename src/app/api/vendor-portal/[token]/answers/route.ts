/**
 * Vendor Portal Answers API
 *
 * GET /api/vendor-portal/[token]/answers - Get all answers for questionnaire
 * POST /api/vendor-portal/[token]/answers - Save/update an answer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * Validate questionnaire token
 */
async function validateToken(token: string) {
  const supabase = createServiceRoleClient();

  const { data: questionnaire, error } = await supabase
    .from('nis2_vendor_questionnaires')
    .select('id, status, token_expires_at')
    .eq('access_token', token)
    .single();

  if (error || !questionnaire) {
    return { valid: false, error: 'Invalid access link' };
  }

  if (new Date(questionnaire.token_expires_at) < new Date()) {
    return { valid: false, error: 'Access link has expired' };
  }

  return { valid: true, questionnaire };
}

/**
 * Get all answers for questionnaire
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: answers, error } = await supabase
      .from('nis2_questionnaire_answers')
      .select('*')
      .eq('questionnaire_id', validation.questionnaire.id);

    if (error) {
      console.error('Fetch answers error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    console.error('Get answers error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Save/update an answer
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const validation = await validateToken(token);
    if (!validation.valid || !validation.questionnaire) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Access link has expired' ? 410 : 401 }
      );
    }

    const questionnaire = validation.questionnaire;

    // Check if questionnaire can be edited
    if (!['sent', 'in_progress', 'rejected'].includes(questionnaire.status)) {
      return NextResponse.json(
        { error: 'Questionnaire cannot be edited' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      question_id,
      answer_text,
      answer_json,
      source = 'manual',
      vendor_confirmed = false,
    } = body;

    if (!question_id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Upsert answer
    const { data: answer, error } = await supabase
      .from('nis2_questionnaire_answers')
      .upsert(
        {
          questionnaire_id: questionnaire.id,
          question_id,
          answer_text,
          answer_json,
          source,
          vendor_confirmed,
          vendor_confirmed_at: vendor_confirmed ? new Date().toISOString() : null,
        },
        {
          onConflict: 'questionnaire_id,question_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Save answer error:', error);
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    console.error('Save answer error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
