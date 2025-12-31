/**
 * RoI API Endpoint
 *
 * GET /api/roi - Get all template stats
 * POST /api/roi - Generate RoI package
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchAllTemplateStats,
  ROI_TEMPLATES,
  type RoiTemplateId,
} from '@/lib/roi';

export async function GET() {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Fetch stats for all templates
    const stats = await fetchAllTemplateStats();

    // Calculate overall metrics
    const totalRows = stats.reduce((sum, s) => sum + s.rowCount, 0);
    const avgCompleteness = stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.completeness, 0) / stats.length)
      : 0;
    const templatesWithData = stats.filter(s => s.hasData).length;

    // Days until deadline (April 30, 2025)
    const deadline = new Date('2025-04-30');
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      data: {
        templates: stats,
        summary: {
          totalTemplates: stats.length,
          templatesWithData,
          totalRows,
          avgCompleteness,
          deadline: deadline.toISOString().split('T')[0],
          daysUntilDeadline,
        },
      },
    });
  } catch (error) {
    console.error('[RoI API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch RoI stats' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'refresh') {
      // Just refresh stats
      const stats = await fetchAllTemplateStats();
      return NextResponse.json({
        success: true,
        data: { templates: stats },
      });
    }

    // List available templates
    const templates = Object.entries(ROI_TEMPLATES).map(([id, template]) => ({
      id: id as RoiTemplateId,
      name: template.name,
      description: template.description,
      esaReference: template.esaReference,
      columnCount: template.columnCount,
    }));

    return NextResponse.json({
      success: true,
      data: { templates },
    });
  } catch (error) {
    console.error('[RoI API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process request' } },
      { status: 500 }
    );
  }
}
