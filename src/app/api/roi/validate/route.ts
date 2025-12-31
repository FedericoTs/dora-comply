/**
 * RoI Validation API Endpoint
 *
 * POST /api/roi/validate - Validate all templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchTemplateData,
  validateRoi,
  enhanceErrorsWithSuggestions,
  type RoiTemplateId,
} from '@/lib/roi';

export const maxDuration = 60; // Allow up to 60s for full validation

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
    const { includeAiSuggestions = true, templateIds } = body;

    // Fetch data for all templates
    const templates: RoiTemplateId[] = templateIds || [
      'B_01.01', 'B_01.02', 'B_01.03',
      'B_02.01', 'B_02.02', 'B_02.03',
      'B_03.01', 'B_03.02', 'B_03.03',
      'B_04.01', 'B_05.01', 'B_05.02',
      'B_06.01', 'B_07.01',
    ];

    const templateData: Record<string, Record<string, unknown>[]> = {};

    for (const templateId of templates) {
      const result = await fetchTemplateData(templateId);
      templateData[templateId] = result.data;
    }

    // Run validation
    const validationResult = await validateRoi(
      templateData as Record<RoiTemplateId, Record<string, unknown>[]>
    );

    // Enhance errors with AI suggestions if requested
    if (includeAiSuggestions) {
      for (const templateId of Object.keys(validationResult.templateResults)) {
        const result = validationResult.templateResults[templateId as RoiTemplateId];
        result.errors = enhanceErrorsWithSuggestions(result.errors);
        result.warnings = enhanceErrorsWithSuggestions(result.warnings);
      }
    }

    // Build summary
    const summary = {
      isValid: validationResult.isValid,
      overallScore: validationResult.overallScore,
      totalErrors: validationResult.totalErrors,
      totalWarnings: validationResult.totalWarnings,
      templateSummary: Object.entries(validationResult.templateResults).map(([id, result]) => ({
        templateId: id,
        rowCount: result.rowCount,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        completeness: validationResult.completeness[id as RoiTemplateId] || 0,
      })),
    };

    // Collect top errors (most critical first)
    const allErrors = Object.values(validationResult.templateResults)
      .flatMap(r => r.errors)
      .sort((a, b) => {
        if (a.severity === 'error' && b.severity !== 'error') return -1;
        if (a.severity !== 'error' && b.severity === 'error') return 1;
        return 0;
      })
      .slice(0, 20); // Top 20 errors

    return NextResponse.json({
      success: true,
      data: {
        summary,
        topErrors: allErrors,
        templateResults: validationResult.templateResults,
        completeness: validationResult.completeness,
      },
    });
  } catch (error) {
    console.error('[RoI Validate API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to validate RoI' } },
      { status: 500 }
    );
  }
}
