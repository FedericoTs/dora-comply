/**
 * Template Export API Endpoint
 *
 * GET /api/roi/[templateId]/export - Download CSV for a specific template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchTemplateData,
  generateCsv,
  ROI_TEMPLATES,
  type RoiTemplateId,
} from '@/lib/roi';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Validate template ID
    // Convert URL format (b_01_01) to template format (B_01.01)
    // Pattern: replace LAST underscore with dot, then uppercase
    const templateIdNormalized = templateId
      .toUpperCase()
      .replace(/_([^_]+)$/, '.$1') as RoiTemplateId;

    if (!ROI_TEMPLATES[templateIdNormalized]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Template ${templateId} not found` } },
        { status: 404 }
      );
    }

    // Fetch template data
    const result = await fetchTemplateData(templateIdNormalized);

    if (result.error) {
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: result.error } },
        { status: 500 }
      );
    }

    // Generate CSV
    const csv = generateCsv({
      templateId: templateIdNormalized,
      data: result.data,
    });

    // Return CSV file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="${csv.fileName}"`);
    headers.set('X-Row-Count', String(csv.rowCount));
    headers.set('X-Column-Count', String(csv.columnCount));

    return new NextResponse(csv.csv, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[RoI Export API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to export template' } },
      { status: 500 }
    );
  }
}
