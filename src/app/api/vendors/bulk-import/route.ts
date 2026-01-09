/**
 * Bulk Import API Route
 *
 * POST /api/vendors/bulk-import
 * Handles bulk creation of vendors from CSV import.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkImportRowSchema, type BulkImportRow } from '@/lib/vendors/schemas';
import { z } from 'zod';

const bulkImportRequestSchema = z.object({
  vendors: z.array(bulkImportRowSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { success: false, error: { message: 'Organization not found' } },
        { status: 400 }
      );
    }

    const organizationId = userData.organization_id;

    // Parse and validate request body
    const body = await request.json();
    const parsed = bulkImportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request data',
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { vendors } = parsed.data;

    // Parse service_types from comma-separated string to array
    const vendorsToInsert = vendors.map((vendor: BulkImportRow) => {
      const serviceTypes = vendor.service_types
        ? vendor.service_types
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      return {
        organization_id: organizationId,
        name: vendor.name,
        lei: vendor.lei || null,
        tier: vendor.tier || 'standard',
        provider_type: vendor.provider_type || 'other',
        headquarters_country: vendor.headquarters_country || null,
        service_types: serviceTypes.length > 0 ? serviceTypes : null,
        supports_critical_function: vendor.supports_critical_function || false,
        contact_name: vendor.contact_name || null,
        contact_email: vendor.contact_email || null,
        notes: vendor.notes || null,
        status: 'active',
        risk_score: null,
        last_assessment_date: null,
        contract_start_date: null,
        contract_end_date: null,
        contract_value: null,
        created_by: user.id,
      };
    });

    // Insert vendors
    const { data: inserted, error: insertError } = await supabase
      .from('vendors')
      .insert(vendorsToInsert)
      .select('id, name');

    if (insertError) {
      console.error('Bulk import error:', insertError);

      // Handle unique constraint violations
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Some vendors already exist (duplicate LEI or name)',
              code: 'DUPLICATE_VENDOR',
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: { message: insertError.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        created: inserted?.length || 0,
        vendors: inserted,
      },
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
