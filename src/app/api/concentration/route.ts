/**
 * Concentration Risk API
 *
 * GET /api/concentration - Returns comprehensive concentration risk data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Vendor } from '@/lib/vendors/types';
import {
  calculateServiceHHI,
  detectSinglePointsOfFailure,
  calculateGeographicSpread,
  generateHeatMapData,
  generateRiskLevelSummaries,
  generateConcentrationAlerts,
  calculateConcentrationMetrics,
} from '@/lib/concentration/calculations';
import type {
  ConcentrationOverviewResponse,
  HeatMapResponse,
  ConcentrationMetrics,
  SinglePointOfFailure,
  ConcentrationAlert,
} from '@/lib/concentration/types';

// Map database row to Vendor type
function mapVendorFromDatabase(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    name: row.name as string,
    lei: row.lei as string | null,
    tier: row.tier as Vendor['tier'],
    status: row.status as Vendor['status'],
    provider_type: row.provider_type as Vendor['provider_type'],
    headquarters_country: row.headquarters_country as string | null,
    jurisdiction: row.jurisdiction as string | null,
    service_types: (row.service_types as string[]) || [],
    supports_critical_function: row.supports_critical_function as boolean,
    critical_functions: (row.critical_functions as string[]) || [],
    is_intra_group: row.is_intra_group as boolean,
    parent_provider_id: row.parent_provider_id as string | null,
    registration_number: row.registration_number as string | null,
    regulatory_authorizations: (row.regulatory_authorizations as string[]) || [],
    risk_score: row.risk_score as number | null,
    last_assessment_date: row.last_assessment_date as string | null,
    primary_contact: (row.primary_contact as Vendor['primary_contact']) || { name: '' },
    notes: row.notes as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
    lei_status: row.lei_status as Vendor['lei_status'],
    lei_verified_at: row.lei_verified_at as string | null,
    lei_next_renewal: row.lei_next_renewal as string | null,
    entity_status: row.entity_status as Vendor['entity_status'],
    registration_authority_id: row.registration_authority_id as string | null,
    legal_form_code: row.legal_form_code as string | null,
    entity_creation_date: row.entity_creation_date as string | null,
    legal_address: row.legal_address as Vendor['legal_address'],
    headquarters_address: row.headquarters_address as Vendor['headquarters_address'],
    gleif_data: row.gleif_data as Record<string, unknown> | null,
    gleif_fetched_at: row.gleif_fetched_at as string | null,
    direct_parent_lei: row.direct_parent_lei as string | null,
    direct_parent_name: row.direct_parent_name as string | null,
    direct_parent_country: row.direct_parent_country as string | null,
    ultimate_parent_lei: row.ultimate_parent_lei as string | null,
    ultimate_parent_name: row.ultimate_parent_name as string | null,
    ultimate_parent_country: row.ultimate_parent_country as string | null,
    esa_register_id: row.esa_register_id as string | null,
    substitutability_assessment: row.substitutability_assessment as Vendor['substitutability_assessment'],
    total_annual_expense: row.total_annual_expense as number | null,
    expense_currency: row.expense_currency as string | null,
  };
}

async function getCurrentUserOrganization(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

interface ConcentrationResponse {
  overview: ConcentrationOverviewResponse;
  heatMap: HeatMapResponse;
  metrics: ConcentrationMetrics;
  spofs: SinglePointOfFailure[];
  alerts: ConcentrationAlert[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const organizationId = await getCurrentUserOrganization(supabase);

    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active vendors for the organization
    const { data: vendorData, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .in('status', ['active', 'pending']);

    if (error) {
      console.error('Concentration API error:', error);
      return NextResponse.json({ error: 'Failed to fetch vendor data' }, { status: 500 });
    }

    const vendors = (vendorData || []).map(mapVendorFromDatabase);

    // Calculate all concentration metrics
    const serviceHHI = calculateServiceHHI(vendors);
    const spofs = detectSinglePointsOfFailure(vendors);
    const geoData = calculateGeographicSpread(vendors);
    const heatMapData = generateHeatMapData(vendors);
    const riskLevels = generateRiskLevelSummaries(vendors, spofs, geoData.alerts);
    const alerts = generateConcentrationAlerts(vendors, spofs, serviceHHI, geoData);
    const metrics = calculateConcentrationMetrics(vendors);

    const response: ConcentrationResponse = {
      overview: {
        risk_levels: riskLevels,
        alerts: alerts.slice(0, 5), // Top 5 alerts for overview
        spof_count: spofs.length,
        last_updated: new Date().toISOString(),
      },
      heatMap: {
        cells: heatMapData.cells,
        dimensions: {
          services: heatMapData.services,
          regions: heatMapData.regions,
        },
        max_concentration: Math.max(...heatMapData.cells.map(c => c.concentration_score), 0),
      },
      metrics,
      spofs,
      alerts,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Concentration API unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
