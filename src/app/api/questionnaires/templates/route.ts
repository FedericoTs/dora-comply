/**
 * GET /api/questionnaires/templates
 *
 * List all questionnaire templates for the organization
 */

import { NextResponse } from 'next/server';
import { getTemplates } from '@/lib/nis2-questionnaire/queries';

export async function GET() {
  try {
    const templates = await getTemplates();

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}
