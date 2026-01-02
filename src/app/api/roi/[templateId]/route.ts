/**
 * Template Data API Endpoint
 *
 * GET /api/roi/[templateId] - Get data for a specific template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchTemplateData,
  validateTemplate,
  ROI_TEMPLATES,
  getColumnOrder,
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

    // Validate template ID - URL has underscores (b_01_01), convert to internal format (B_01.01)
    // Only replace the LAST underscore with a dot
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

    // Validate the data
    const validation = validateTemplate(templateIdNormalized, result.data);

    // Get template metadata
    const template = ROI_TEMPLATES[templateIdNormalized];
    const columns = getColumnOrder(templateIdNormalized);

    return NextResponse.json({
      success: true,
      data: {
        templateId: templateIdNormalized,
        name: template.name,
        description: template.description,
        esaReference: template.esaReference,
        columns,
        rows: result.data,
        rowCount: result.count,
        validation: {
          isValid: validation.isValid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          errors: validation.errors.slice(0, 10), // Limit to first 10
          warnings: validation.warnings.slice(0, 10),
        },
      },
    });
  } catch (error) {
    console.error('[RoI Template API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch template data' } },
      { status: 500 }
    );
  }
}
