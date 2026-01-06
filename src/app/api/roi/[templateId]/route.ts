/**
 * Template Data API Endpoint
 *
 * GET /api/roi/[templateId] - Get data for a specific template
 * PUT /api/roi/[templateId] - Update existing record
 * POST /api/roi/[templateId] - Create new record
 * DELETE /api/roi/[templateId] - Soft delete records
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
  TEMPLATE_PRIMARY_TABLES,
  getSmartDefaults,
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
 * POST - Create new record with smart defaults
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

    // Get primary table for this template
    const primaryTable = TEMPLATE_PRIMARY_TABLES[templateIdNormalized];
    if (!primaryTable) {
      return NextResponse.json(
        { error: { code: 'NO_TABLE', message: `Template ${templateIdNormalized} does not support record creation` } },
        { status: 400 }
      );
    }

    // Get user's organization
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

    // Get organization LEI for smart defaults
    const { data: org } = await supabase
      .from('organizations')
      .select('lei')
      .eq('id', organizationId)
      .single();

    const body = await request.json();
    const { record = {} } = body;

    // Get smart defaults for this template
    const defaults = getSmartDefaults(templateIdNormalized, {
      organizationLei: org?.lei,
      organizationId,
      userId: user.id,
    });

    // Merge defaults with provided record (provided values override defaults)
    const mergedRecord = { ...defaults, ...record };

    console.log(`[RoI API] Creating ${templateIdNormalized} record in ${primaryTable}:`, mergedRecord);

    // Build the database record based on template type
    const dbRecord = await buildDbRecord(
      templateIdNormalized,
      primaryTable,
      mergedRecord,
      organizationId,
      user.id
    );

    console.log(`[RoI API] DB record to insert:`, dbRecord);

    // Insert the record
    const { data: insertedData, error: insertError } = await supabase
      .from(primaryTable)
      .insert(dbRecord)
      .select()
      .single();

    if (insertError) {
      console.error('[RoI API] Insert error:', insertError);
      return NextResponse.json(
        { error: { code: 'INSERT_FAILED', message: insertError.message } },
        { status: 500 }
      );
    }

    console.log(`[RoI API] Record created successfully:`, insertedData);

    return NextResponse.json({
      success: true,
      templateId: templateIdNormalized,
      data: insertedData,
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
 * DELETE - Soft delete records
 */
export async function DELETE(
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

    // Get primary table for this template
    const primaryTable = TEMPLATE_PRIMARY_TABLES[templateIdNormalized];
    if (!primaryTable) {
      return NextResponse.json(
        { error: { code: 'NO_TABLE', message: `Template ${templateIdNormalized} does not support record deletion` } },
        { status: 400 }
      );
    }

    // Get user's organization
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

    const body = await request.json();
    const { rowIndices, recordIds } = body;

    if ((!rowIndices || rowIndices.length === 0) && (!recordIds || recordIds.length === 0)) {
      return NextResponse.json(
        { error: { code: 'NO_RECORDS', message: 'No records specified for deletion' } },
        { status: 400 }
      );
    }

    console.log(`[RoI API] DELETE request for ${templateIdNormalized}:`, { rowIndices, recordIds });

    // Get record IDs if only indices provided
    let idsToDelete: string[] = recordIds || [];

    if (rowIndices && rowIndices.length > 0 && idsToDelete.length === 0) {
      // Fetch records to get IDs
      let query = supabase.from(primaryTable).select('id').order('created_at');

      // Apply organization filter
      if (primaryTable === 'organizations') {
        query = supabase.from(primaryTable).select('id').eq('id', organizationId);
      } else {
        query = supabase.from(primaryTable).select('id').eq('organization_id', organizationId).order('created_at');
      }

      const { data: records, error: fetchError } = await query;

      if (fetchError) {
        console.error('[RoI API] Fetch error:', fetchError);
        return NextResponse.json(
          { error: { code: 'FETCH_ERROR', message: fetchError.message } },
          { status: 500 }
        );
      }

      // Map indices to IDs
      idsToDelete = rowIndices
        .filter((idx: number) => records && records[idx])
        .map((idx: number) => records![idx].id);
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_RECORDS', message: 'No valid records found for deletion' } },
        { status: 404 }
      );
    }

    console.log(`[RoI API] Soft deleting ${idsToDelete.length} records:`, idsToDelete);

    // Soft delete: set deleted_at timestamp
    const { data: deletedData, error: deleteError } = await supabase
      .from(primaryTable)
      .update({ deleted_at: new Date().toISOString() })
      .in('id', idsToDelete)
      .select();

    if (deleteError) {
      console.error('[RoI API] Delete error:', deleteError);
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: deleteError.message } },
        { status: 500 }
      );
    }

    console.log(`[RoI API] Soft deleted ${deletedData?.length || 0} records`);

    return NextResponse.json({
      success: true,
      templateId: templateIdNormalized,
      deletedCount: deletedData?.length || 0,
      deletedIds: idsToDelete,
    });
  } catch (error) {
    console.error('[RoI Template API] DELETE Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete records' } },
      { status: 500 }
    );
  }
}

/**
 * Build database record from ESA column values
 */
async function buildDbRecord(
  templateId: RoiTemplateId,
  primaryTable: string,
  esaRecord: Record<string, unknown>,
  organizationId: string,
  userId: string
): Promise<Record<string, unknown>> {
  const mapping = TEMPLATE_MAPPINGS[templateId];
  const dbRecord: Record<string, unknown> = {
    organization_id: organizationId,
    created_by: userId,
  };

  // For organizations table, we don't set organization_id or created_by
  if (primaryTable === 'organizations') {
    delete dbRecord.organization_id;
    delete dbRecord.created_by;
  }

  if (!mapping) {
    // No mapping, return just org context
    return dbRecord;
  }

  // Transform ESA codes to DB columns
  for (const [esaCode, value] of Object.entries(esaRecord)) {
    const columnMapping = mapping[esaCode];
    if (!columnMapping) continue;
    if (columnMapping.dbColumn === '_computed') continue; // Skip computed columns
    if (columnMapping.dbTable !== primaryTable) continue; // Skip columns from other tables

    let dbValue = value;

    // Reverse transform enum values
    if (columnMapping.enumeration && typeof value === 'string') {
      const entry = Object.entries(columnMapping.enumeration).find(
        ([_, ebaCode]) => ebaCode === value
      );
      if (entry) {
        dbValue = entry[0];
      }
    }

    dbRecord[columnMapping.dbColumn] = dbValue;
  }

  return dbRecord;
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
      // B_02.02 is special: data is indexed by ict_services, but some columns are in related tables
      // We need to find the related record through the ict_services foreign key
      if (templateIdNormalized === 'B_02.02') {
        // Get ict_services records to find the related contract/vendor
        const { data: services, error: servicesError } = await supabase
          .from('ict_services')
          .select('id, contract_id, vendor_id')
          .eq('organization_id', organizationId)
          .order('created_at');

        if (servicesError) {
          console.error('[RoI API] Fetch ict_services error:', servicesError);
          return NextResponse.json(
            { error: { code: 'FETCH_ERROR', message: servicesError.message } },
            { status: 500 }
          );
        }

        if (!services || !services[rowIndex]) {
          console.error('[RoI API] Service not found at index:', rowIndex, 'Total:', services?.length);
          return NextResponse.json(
            { error: { code: 'RECORD_NOT_FOUND', message: `Service at index ${rowIndex} not found` } },
            { status: 404 }
          );
        }

        const service = services[rowIndex];
        console.log(`[RoI API] B_02.02 service at index ${rowIndex}:`, service);

        // Determine which related record to update based on dbTable
        if (dbTable === 'contracts') {
          actualRecordId = service.contract_id;
        } else if (dbTable === 'vendors') {
          actualRecordId = service.vendor_id;
        } else if (dbTable === 'ict_services') {
          actualRecordId = service.id;
        } else {
          // For other tables (like service_data_locations), we need more complex handling
          console.error('[RoI API] Unsupported table for B_02.02:', dbTable);
          return NextResponse.json(
            { error: { code: 'UNSUPPORTED_TABLE', message: `Table ${dbTable} not supported for inline editing in B_02.02` } },
            { status: 400 }
          );
        }

        if (!actualRecordId) {
          console.error('[RoI API] Related record ID not found for table:', dbTable);
          return NextResponse.json(
            { error: { code: 'RECORD_NOT_FOUND', message: `No related ${dbTable} record found` } },
            { status: 404 }
          );
        }
      } else {
        // Standard handling for other templates
        // Build query based on table type
        let query = supabase.from(dbTable).select('id').order('created_at');

        // Apply organization filter for tables that have it
        if (dbTable === 'organizations') {
          // Organizations table - the record IS the organization
          query = supabase.from(dbTable).select('id').eq('id', organizationId);
        } else if (dbTable === 'vendors' || dbTable === 'contracts' || dbTable === 'ict_services') {
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
