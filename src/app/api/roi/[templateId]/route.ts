/**
 * Template Data API Endpoint
 *
 * GET /api/roi/[templateId] - Get data for a specific template
 * PUT /api/roi/[templateId] - Update existing record
 * POST /api/roi/[templateId] - Create new record
 * PATCH /api/roi/[templateId] - Update single cell
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchTemplateData,
  validateTemplate,
  ROI_TEMPLATES,
  getColumnOrder,
  TEMPLATE_MAPPINGS,
  type RoiTemplateId,
} from '@/lib/roi';

// Normalize template ID from URL format (b_01_01) to internal format (B_01.01)
function normalizeTemplateId(templateId: string): RoiTemplateId {
  return templateId
    .toUpperCase()
    .replace(/_([^_]+)$/, '.$1') as RoiTemplateId;
}

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

/**
 * PUT - Update existing record
 * Note: Full implementation depends on template type and database schema
 */
export async function PUT(
  request: NextRequest,
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

    const templateIdNormalized = normalizeTemplateId(templateId);

    if (!ROI_TEMPLATES[templateIdNormalized]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Template ${templateId} not found` } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { record, index } = body;

    // Log the update (TODO: implement actual database updates)
    console.log(`[RoI API] Update ${templateIdNormalized} record ${index}:`, record);

    // TODO: Implement per-template update logic
    // B_01.01 -> update organizations table
    // B_05.01 -> update vendors table
    // B_02.01 -> update contracts table
    // etc.

    return NextResponse.json({
      success: true,
      message: 'Record update acknowledged',
      templateId: templateIdNormalized,
    });
  } catch (error) {
    console.error('[RoI Template API] PUT Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update record' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new record
 * Note: Full implementation depends on template type and database schema
 */
export async function POST(
  request: NextRequest,
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

    const templateIdNormalized = normalizeTemplateId(templateId);

    if (!ROI_TEMPLATES[templateIdNormalized]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Template ${templateId} not found` } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { record } = body;

    // Log the create (TODO: implement actual database inserts)
    console.log(`[RoI API] Create ${templateIdNormalized} record:`, record);

    // TODO: Implement per-template create logic

    return NextResponse.json({
      success: true,
      message: 'Record creation acknowledged',
      templateId: templateIdNormalized,
    });
  } catch (error) {
    console.error('[RoI Template API] POST Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create record' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update single cell value
 * More efficient for inline editing - updates one field at a time
 */
export async function PATCH(
  request: NextRequest,
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

    const templateIdNormalized = normalizeTemplateId(templateId);

    if (!ROI_TEMPLATES[templateIdNormalized]) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Template ${templateId} not found` } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rowIndex, columnCode, value, recordId } = body;

    console.log(`[RoI API] PATCH request:`, { templateId: templateIdNormalized, rowIndex, columnCode, value });

    // Get template mapping to find the database column
    const mapping = TEMPLATE_MAPPINGS[templateIdNormalized];
    if (!mapping) {
      return NextResponse.json(
        { error: { code: 'NO_MAPPING', message: `Template ${templateIdNormalized} has no direct mapping` } },
        { status: 400 }
      );
    }

    const columnMapping = mapping[columnCode];
    if (!columnMapping) {
      return NextResponse.json(
        { error: { code: 'INVALID_COLUMN', message: `Column ${columnCode} not found in mapping` } },
        { status: 400 }
      );
    }

    const { dbColumn, dbTable } = columnMapping;
    console.log(`[RoI API] Mapping: ${columnCode} -> ${dbTable}.${dbColumn}`);

    // Check if this is a computed column (not editable)
    if (dbColumn === '_computed') {
      return NextResponse.json(
        { error: { code: 'READ_ONLY', message: `Column ${columnCode} is computed and cannot be edited` } },
        { status: 400 }
      );
    }

    // Get user's organization for RLS
    const { data: userOrg, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError || !userOrg?.organization_id) {
      console.error('[RoI API] Organization lookup error:', orgError);
      return NextResponse.json(
        { error: { code: 'NO_ORG', message: 'User organization not found' } },
        { status: 403 }
      );
    }

    const organizationId = userOrg.organization_id;

    // Get record ID if not provided (need to fetch data first)
    let actualRecordId = recordId;
    if (!actualRecordId) {
      // Build query based on table type
      let query = supabase.from(dbTable).select('id').order('created_at');

      // Apply organization filter for tables that have it
      if (dbTable === 'organizations') {
        // Organizations table - the record IS the organization
        query = supabase.from(dbTable).select('id').eq('id', organizationId);
      } else if (dbTable === 'vendors' || dbTable === 'contracts') {
        // Tables with organization_id column
        query = supabase.from(dbTable).select('id').eq('organization_id', organizationId).order('created_at');
      }

      const { data: records, error: fetchError } = await query;

      if (fetchError) {
        console.error('[RoI API] Fetch error:', fetchError);
        return NextResponse.json(
          { error: { code: 'FETCH_ERROR', message: fetchError.message } },
          { status: 500 }
        );
      }

      if (!records || !records[rowIndex]) {
        console.error('[RoI API] Record not found at index:', rowIndex, 'Total records:', records?.length);
        return NextResponse.json(
          { error: { code: 'RECORD_NOT_FOUND', message: `Record at index ${rowIndex} not found` } },
          { status: 404 }
        );
      }
      actualRecordId = records[rowIndex].id;
    }

    console.log(`[RoI API] Target record ID: ${actualRecordId}`);

    // Convert EBA enum values back to database values if needed
    let dbValue = value;
    if (columnMapping.enumeration) {
      // Check if the value is an EBA code (e.g., "eba_GA:DE") and convert to key
      const enumEntry = Object.entries(columnMapping.enumeration).find(
        ([_, ebaCode]) => ebaCode === value
      );
      if (enumEntry) {
        dbValue = enumEntry[0]; // Use the key (e.g., "DE")
      }
    }

    console.log(`[RoI API] Updating ${dbTable}.${dbColumn} = "${dbValue}" for record ${actualRecordId}`);

    // Update the record
    const { data: updateData, error: updateError } = await supabase
      .from(dbTable)
      .update({ [dbColumn]: dbValue })
      .eq('id', actualRecordId)
      .select();

    if (updateError) {
      console.error('[RoI API] Update error:', updateError);
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`[RoI API] Update successful:`, updateData);

    return NextResponse.json({
      success: true,
      templateId: templateIdNormalized,
      rowIndex,
      columnCode,
      value: dbValue,
      updated: updateData,
    });
  } catch (error) {
    console.error('[RoI Template API] PATCH Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update cell' } },
      { status: 500 }
    );
  }
}
