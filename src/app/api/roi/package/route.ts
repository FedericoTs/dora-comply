/**
 * RoI Package Download API Endpoint
 *
 * GET /api/roi/package - Download complete xBRL-CSV package as ZIP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchTemplateData,
  buildPackageZip,
  getDefaultParameters,
  validateParameters,
  type RoiTemplateId,
} from '@/lib/roi';

export const maxDuration = 60; // Allow up to 60s for package generation

export async function GET(request: NextRequest) {
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

    // Get organization LEI - query users table (not profiles)
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord?.organization_id) {
      console.error('[RoI Package API] User lookup error:', userError);
      return NextResponse.json(
        { error: { code: 'NO_ORG', message: 'User organization not found. Please contact support.' } },
        { status: 400 }
      );
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('lei, name')
      .eq('id', userRecord.organization_id)
      .single();

    if (orgError) {
      console.error('[RoI Package API] Organization lookup error:', orgError);
      return NextResponse.json(
        { error: { code: 'ORG_ERROR', message: 'Failed to fetch organization data.' } },
        { status: 500 }
      );
    }

    if (!org?.lei) {
      return NextResponse.json(
        { error: { code: 'MISSING_LEI', message: 'Organization LEI is required for RoI export. Please update your organization settings.' } },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportingDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Build package parameters
    const parameters = getDefaultParameters(org.lei, reportingDate);

    // Validate parameters
    const paramValidation = validateParameters(parameters);
    if (!paramValidation.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: paramValidation.errors.join(', ') } },
        { status: 400 }
      );
    }

    // Fetch data for all templates
    const templates: RoiTemplateId[] = [
      'B_01.01', 'B_01.02', 'B_01.03',
      'B_02.01', 'B_02.02', 'B_02.03',
      'B_03.01', 'B_03.02', 'B_03.03',
      'B_04.01', 'B_05.01', 'B_05.02',
      'B_06.01', 'B_07.01',
    ];

    const templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>> = {};

    for (const templateId of templates) {
      const result = await fetchTemplateData(templateId);
      templateData[templateId] = result.data;
    }

    // Build ZIP package
    const { buffer, fileName } = await buildPackageZip({
      parameters,
      templateData,
    });

    // Return ZIP file
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', String(buffer.length));
    headers.set('X-Organization', org.name || org.lei);
    headers.set('X-Reporting-Date', reportingDate);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[RoI Package API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate RoI package' } },
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
    // Note: validateFirst is reserved for future pre-export validation
    const body = await request.json().catch(() => ({}));
    const { reportingDate } = body;

    // Get organization LEI - query users table (not profiles)
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord?.organization_id) {
      console.error('[RoI Package API] User lookup error:', userError);
      return NextResponse.json(
        { error: { code: 'NO_ORG', message: 'User organization not found' } },
        { status: 400 }
      );
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('lei, name')
      .eq('id', userRecord.organization_id)
      .single();

    if (orgError || !org?.lei) {
      return NextResponse.json(
        { error: { code: 'MISSING_LEI', message: 'Organization LEI is required for RoI export' } },
        { status: 400 }
      );
    }

    // Build parameters
    const date = reportingDate || new Date().toISOString().split('T')[0];
    const parameters = getDefaultParameters(org.lei, date);

    // Fetch all data
    const templates: RoiTemplateId[] = [
      'B_01.01', 'B_01.02', 'B_01.03',
      'B_02.01', 'B_02.02', 'B_02.03',
      'B_03.01', 'B_03.02', 'B_03.03',
      'B_04.01', 'B_05.01', 'B_05.02',
      'B_06.01', 'B_07.01',
    ];

    const templateData: Partial<Record<RoiTemplateId, Record<string, unknown>[]>> = {};
    let totalRows = 0;

    for (const templateId of templates) {
      const result = await fetchTemplateData(templateId);
      templateData[templateId] = result.data;
      totalRows += result.count;
    }

    // Return package info (for preview before download)
    return NextResponse.json({
      success: true,
      data: {
        parameters: {
          entityId: parameters.entityId,
          refPeriod: parameters.refPeriod,
          baseCurrency: parameters.baseCurrency,
        },
        organization: {
          lei: org.lei,
          name: org.name,
        },
        summary: {
          totalTemplates: templates.length,
          totalRows,
          templatesWithData: Object.values(templateData).filter(d => d && d.length > 0).length,
        },
        downloadUrl: `/api/roi/package?date=${date}`,
      },
    });
  } catch (error) {
    console.error('[RoI Package API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to prepare package' } },
      { status: 500 }
    );
  }
}
