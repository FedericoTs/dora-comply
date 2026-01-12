/**
 * RoI Data Queries
 *
 * Server-side queries to fetch data for ESA templates
 */

import { createClient } from '@/lib/supabase/server';
import type { RoiTemplateId, NextAction, PopulatableDocument, TemplateWithStatus } from './types';
import {
  TEMPLATE_MAPPINGS,
  EBA_COUNTRY_CODES,
  EBA_ENTITY_TYPES,
  EBA_SERVICE_TYPES,
  EBA_CODE_TYPES,
  EBA_SENSITIVENESS,
  EBA_SUBSTITUTABILITY,
  EBA_REINTEGRATION,
  EBA_IMPACT_LEVELS,
  EBA_CRITICALITY,
  ISO_CURRENCY_CODES,
} from './mappings';

// ============================================================================
// Types
// ============================================================================

interface QueryResult<T> {
  data: T[];
  count: number;
  error: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function mapToEbaCountry(code: string | null | undefined): string {
  if (!code) return 'eba_GA:XX';
  return EBA_COUNTRY_CODES[code.toUpperCase()] || 'eba_GA:XX';
}

function mapToEbaEntityType(type: string | null | undefined): string {
  if (!type) return 'eba_CT:x12';
  return EBA_ENTITY_TYPES[type] || 'eba_CT:x12';
}

function mapToEbaServiceType(type: string | null | undefined): string {
  if (!type) return 'eba_TA:x99';
  return EBA_SERVICE_TYPES[type] || 'eba_TA:x99';
}

function mapToEbaSensitiveness(level: string | null | undefined): string {
  if (!level) return 'eba_ZZ:x791';
  const mapping: Record<string, string> = {
    low: 'eba_ZZ:x791',
    medium: 'eba_ZZ:x792',
    high: 'eba_ZZ:x793',
  };
  return mapping[level.toLowerCase()] || 'eba_ZZ:x791';
}

function mapToEbaSubstitutability(value: string | null | undefined): string {
  if (!value) return 'eba_ZZ:x962';
  return EBA_SUBSTITUTABILITY[value] || 'eba_ZZ:x962';
}

function mapToEbaReintegration(value: string | null | undefined): string {
  if (!value) return 'eba_ZZ:x963';
  return EBA_REINTEGRATION[value] || 'eba_ZZ:x963';
}

function mapToEbaImpact(level: string | null | undefined): string {
  if (!level) return 'eba_ZZ:x0';
  const mapping: Record<string, string> = {
    low: 'eba_ZZ:x0',
    medium: 'eba_ZZ:x1',
    high: 'eba_ZZ:x2',
  };
  return mapping[level.toLowerCase()] || 'eba_ZZ:x0';
}

function mapToEbaCriticality(isCritical: boolean | null | undefined): string {
  return isCritical ? 'eba_ZZ:x794' : 'eba_ZZ:x795';
}

function mapToEbaCurrency(currency: string | null | undefined): string {
  if (!currency) return 'eba_CU:ALL';
  return ISO_CURRENCY_CODES[currency.toUpperCase()] || 'eba_CU:ALL';
}

function mapContractType(type: string | null | undefined): string {
  if (!type) return 'eba_CO:x1';
  const mapping: Record<string, string> = {
    master_agreement: 'eba_CO:x2',
    service_agreement: 'eba_CO:x1',
    sla: 'eba_CO:x3',
    nda: 'eba_CO:x4',
    dpa: 'eba_CO:x4',
    amendment: 'eba_CO:x3',
    statement_of_work: 'eba_CO:x3',
    other: 'eba_CO:x1',
  };
  return mapping[type] || 'eba_CO:x1';
}

// ============================================================================
// B_01.01 - Entity Maintaining Register
// ============================================================================

export async function fetchB_01_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, lei, name, jurisdiction, entity_type, competent_authorities, created_at')
    .single();

  if (error || !org) {
    return { data: [], count: 0, error: error?.message || 'Organization not found' };
  }

  // Transform to ESA format
  const row = {
    c0010: org.lei || '',
    c0020: org.name || '',
    c0030: mapToEbaCountry(org.jurisdiction),
    c0040: mapToEbaEntityType(org.entity_type),
    c0050: Array.isArray(org.competent_authorities) ? org.competent_authorities[0] : '',
    c0060: formatDate(org.created_at) || formatDate(new Date()),
  };

  return { data: [row], count: 1, error: null };
}

// ============================================================================
// B_01.02 - Entities in Scope
// ============================================================================

export async function fetchB_01_02(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at');

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (orgs || []).map(org => ({
    c0010: org.lei || '',
    c0020: org.name || '',
    c0030: mapToEbaCountry(org.jurisdiction),
    c0040: mapToEbaEntityType(org.entity_type),
    c0050: org.group_structure || '',
    c0060: org.parent_entity_lei || '',
    c0070: formatDate(org.updated_at),
    c0080: formatDate(org.created_at),
    c0090: formatDate(org.deleted_at), // Soft delete tracking
    c0100: mapToEbaCurrency(org.reporting_currency || 'EUR'),
    c0110: org.total_assets || null,
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_01.03 - Branches
// ============================================================================

export async function fetchB_01_03(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: branches, error } = await supabase
    .from('organization_branches')
    .select(`
      branch_id,
      branch_name,
      country_code,
      organization:organizations(lei)
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (branches || []).map(b => ({
    c0010: b.branch_id || '',
    c0020: (b.organization as { lei?: string })?.lei || '',
    c0030: b.branch_name || '',
    c0040: mapToEbaCountry(b.country_code),
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_02.01 - Contractual Arrangements Overview
// ============================================================================

export async function fetchB_02_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      contract_ref,
      contract_type,
      annual_value,
      currency,
      parent_contract_id,
      parent_contract:contracts!parent_contract_id(contract_ref)
    `)
    .is('deleted_at', null)
    .order('created_at');

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (contracts || []).map(c => ({
    c0010: c.contract_ref || '',
    c0020: mapContractType(c.contract_type),
    c0030: (c.parent_contract as { contract_ref?: string })?.contract_ref || null,
    c0040: mapToEbaCurrency(c.currency),
    c0050: c.annual_value,
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_02.02 - Contractual Arrangements Details
// ============================================================================

export async function fetchB_02_02(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from('ict_services')
    .select(`
      *,
      contract:contracts(
        contract_ref,
        effective_date,
        expiry_date,
        termination_notice_days,
        provider_notice_days,
        governing_law_country,
        dora_provisions
      ),
      vendor:vendors(lei, headquarters_country),
      organization:organizations(lei),
      data_locations:service_data_locations(country_code, location_type)
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (services || []).map(s => {
    const contract = s.contract as {
      contract_ref?: string;
      effective_date?: string;
      expiry_date?: string;
      termination_notice_days?: number;
      provider_notice_days?: number;
      governing_law_country?: string;
      dora_provisions?: Record<string, unknown>;
    };
    const vendor = s.vendor as { lei?: string; headquarters_country?: string };
    const organization = s.organization as { lei?: string };
    const locations = s.data_locations as Array<{ country_code: string; location_type: string }>;

    const storageLocation = locations?.find(l => l.location_type === 'primary_storage');
    const processingLocation = locations?.find(l => l.location_type === 'primary_processing');

    return {
      c0010: contract?.contract_ref || '',
      c0020: organization?.lei || '',
      c0030: vendor?.lei || '',
      c0040: 'eba_qCO:qx2000', // LEI code type
      c0050: s.id, // Function identifier
      c0060: mapToEbaServiceType(s.service_type),
      c0070: formatDate(contract?.effective_date),
      c0080: formatDate(contract?.expiry_date),
      c0090: null, // Termination reason
      c0100: contract?.termination_notice_days,
      c0110: contract?.provider_notice_days, // Provider notice period from DB
      c0120: mapToEbaCountry(contract?.governing_law_country || vendor?.headquarters_country),
      c0130: mapToEbaCountry(s.service_provision_country || vendor?.headquarters_country),
      c0140: s.processes_personal_data || false,
      c0150: storageLocation ? mapToEbaCountry(storageLocation.country_code) : null,
      c0160: processingLocation ? mapToEbaCountry(processingLocation.country_code) : null,
      c0170: mapToEbaSensitiveness(s.data_sensitivity || s.criticality_level),
      c0180: s.criticality_level,
    };
  });

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_02.03 - Linked Contractual Arrangements
// ============================================================================

export async function fetchB_02_03(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  // Fetch contracts that have a parent_contract_id (linked to another contract)
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      contract_ref,
      parent_contract_id,
      parent:contracts!parent_contract_id(contract_ref)
    `)
    .not('parent_contract_id', 'is', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  // Map to ESA format: c0010 = child contract, c0020 = parent contract, c0030 = link type
  const rows = (contracts || []).map(c => ({
    c0010: c.contract_ref || '',
    c0020: (c.parent as { contract_ref?: string })?.contract_ref || '',
    c0030: 'eba_LT:x1', // Type: subsequent/dependent arrangement
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_03.01 - Entity-Arrangement Links
// ============================================================================

export async function fetchB_03_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      contract_ref,
      organization:organizations(lei)
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (contracts || []).map(c => ({
    c0010: c.contract_ref || '',
    c0020: (c.organization as { lei?: string })?.lei || '',
    c0030: true,
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_03.02 - Provider-Arrangement Links
// ============================================================================

export async function fetchB_03_02(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      contract_ref,
      vendor:vendors(lei)
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (contracts || []).map(c => ({
    c0010: c.contract_ref || '',
    c0020: (c.vendor as { lei?: string })?.lei || '',
    c0030: 'eba_qCO:qx2000', // LEI code type
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_03.03 - Intra-Group Provider Links
// ============================================================================

export async function fetchB_03_03(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: arrangements, error } = await supabase
    .from('intra_group_arrangements')
    .select(`
      group_entity_lei,
      contract:contracts(contract_ref)
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (arrangements || []).map(a => ({
    c0010: (a.contract as { contract_ref?: string })?.contract_ref || '',
    c0020: a.group_entity_lei || '',
    c0031: true,
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_04.01 - Service Recipients
// ============================================================================

export async function fetchB_04_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from('ict_services')
    .select(`
      contract:contracts(contract_ref),
      organization:organizations(lei)
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (services || []).map(s => ({
    c0010: (s.contract as { contract_ref?: string })?.contract_ref || '',
    c0020: (s.organization as { lei?: string })?.lei || '',
    c0030: 'eba_BT:x21', // Financial entity
    c0040: null, // Branch code
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_05.01 - ICT Providers
// ============================================================================

export async function fetchB_05_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('*')
    .is('deleted_at', null)
    .order('created_at');

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (vendors || []).map(v => ({
    c0010: v.lei || v.id,
    c0020: v.lei ? 'eba_qCO:qx2000' : 'eba_qCO:qx2099', // LEI or Other code type
    c0030: v.registration_number || null,
    c0040: v.registration_number ? 'eba_qCO:qx2001' : null,
    c0050: v.name || '',
    c0060: v.name || '', // Latin alphabet name
    c0070: 'eba_CT:x212', // Legal person
    c0080: mapToEbaCountry(v.headquarters_country),
    c0090: mapToEbaCurrency(v.expense_currency || 'EUR'),
    c0100: v.total_annual_expense || null, // Total annual expense from DB
    c0110: v.ultimate_parent_lei || null, // Parent LEI from GLEIF Level 2
    c0120: v.ultimate_parent_lei ? 'eba_qCO:qx2000' : null, // LEI code type if parent exists
  }));

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_05.02 - Subcontracting Chain
// ============================================================================

export async function fetchB_05_02(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: subcontractors, error } = await supabase
    .from('subcontractors')
    .select(`
      *,
      vendor:vendors(lei),
      service:ict_services(
        service_type,
        contract:contracts(contract_ref)
      )
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (subcontractors || []).map(s => {
    const vendor = s.vendor as { lei?: string };
    const service = s.service as { service_type?: string; contract?: { contract_ref?: string } };

    return {
      c0010: service?.contract?.contract_ref || '',
      c0020: mapToEbaServiceType(service?.service_type),
      c0030: vendor?.lei || '',
      c0040: 'eba_qCO:qx2000', // LEI code type
      c0050: s.tier_level || 1,
      c0060: s.subcontractor_lei || s.subcontractor_name || '',
      c0070: s.subcontractor_lei ? 'eba_qCO:qx2000' : 'eba_qCO:qx2099',
    };
  });

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_06.01 - Critical Functions
// ============================================================================

export async function fetchB_06_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: functions, error } = await supabase
    .from('critical_functions')
    .select(`
      *,
      organization:organizations(lei),
      mappings:function_service_mapping(
        service:ict_services(rto_hours, rpo_hours)
      )
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (functions || []).map(f => {
    const organization = f.organization as { lei?: string };
    const mappings = f.mappings as Array<{ service?: { rto_hours?: number; rpo_hours?: number } }>;
    const firstService = mappings?.[0]?.service;

    // Use function-level RTO/RPO if available, fallback to service-level
    const rtoHours = f.function_rto_hours ?? firstService?.rto_hours ?? null;
    const rpoHours = f.function_rpo_hours ?? firstService?.rpo_hours ?? null;

    return {
      c0010: f.function_code || f.id,
      c0020: f.function_category || '',
      c0030: f.function_name || '',
      c0040: organization?.lei || '',
      c0050: mapToEbaCriticality(f.is_critical),
      c0060: f.criticality_rationale || null,
      c0070: formatDate(f.updated_at),
      c0080: rtoHours,
      c0090: rpoHours,
      c0100: mapToEbaImpact(f.impact_level || 'medium'),
    };
  });

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_07.01 - Exit Arrangements
// ============================================================================

export async function fetchB_07_01(): Promise<QueryResult<Record<string, unknown>>> {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from('ict_services')
    .select(`
      *,
      contract:contracts(
        contract_ref,
        has_exit_plan,
        reintegration_possibility,
        has_alternative,
        alternative_provider_id,
        alternative_provider:vendors!alternative_provider_id(lei),
        dora_provisions
      ),
      vendor:vendors(lei, last_assessment_date),
      mappings:function_service_mapping(substitutability, substitutability_reason)
    `)
    .is('deleted_at', null);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (services || []).map(s => {
    const contract = s.contract as {
      contract_ref?: string;
      has_exit_plan?: boolean;
      reintegration_possibility?: string;
      has_alternative?: boolean;
      alternative_provider_id?: string;
      alternative_provider?: { lei?: string };
      dora_provisions?: Record<string, unknown>;
    };
    const vendor = s.vendor as { lei?: string; last_assessment_date?: string };
    const mappings = s.mappings as Array<{ substitutability?: string; substitutability_reason?: string }>;
    const provisions = contract?.dora_provisions || {};

    // Determine exit plan status: use explicit field or fallback to dora_provisions
    const hasExitPlan = contract?.has_exit_plan ?? Boolean(provisions.exit_strategy);

    return {
      c0010: contract?.contract_ref || '',
      c0020: vendor?.lei || '',
      c0030: 'eba_qCO:qx2000', // LEI code type
      c0040: mapToEbaServiceType(s.service_type),
      c0050: mapToEbaSubstitutability(mappings?.[0]?.substitutability || 'easily_substitutable'),
      c0060: mappings?.[0]?.substitutability_reason || null, // Reason if not substitutable from DB
      c0070: formatDate(vendor?.last_assessment_date),
      c0080: hasExitPlan,
      c0090: mapToEbaReintegration(contract?.reintegration_possibility || 'easy'),
      c0100: mapToEbaImpact(s.discontinuing_impact || s.criticality_level || 'low'),
      c0110: contract?.has_alternative || false, // Alternatives identified from DB
      c0120: contract?.alternative_provider?.lei || null, // Alternative provider LEI from DB
    };
  });

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// Main Query Dispatcher
// ============================================================================

export async function fetchTemplateData(
  templateId: RoiTemplateId
): Promise<QueryResult<Record<string, unknown>>> {
  const queryMap: Record<RoiTemplateId, () => Promise<QueryResult<Record<string, unknown>>>> = {
    'B_01.01': fetchB_01_01,
    'B_01.02': fetchB_01_02,
    'B_01.03': fetchB_01_03,
    'B_02.01': fetchB_02_01,
    'B_02.02': fetchB_02_02,
    'B_02.03': fetchB_02_03,
    'B_03.01': fetchB_03_01,
    'B_03.02': fetchB_03_02,
    'B_03.03': fetchB_03_03,
    'B_04.01': fetchB_04_01,
    'B_05.01': fetchB_05_01,
    'B_05.02': fetchB_05_02,
    'B_06.01': fetchB_06_01,
    'B_07.01': fetchB_07_01,
    'B_99.01': async () => ({ data: [], count: 0, error: null }),
  };

  const queryFn = queryMap[templateId];
  if (!queryFn) {
    return { data: [], count: 0, error: `Unknown template: ${templateId}` };
  }

  return queryFn();
}

// ============================================================================
// Aggregated Stats
// ============================================================================

export interface RoiStats {
  templateId: RoiTemplateId;
  name: string;
  rowCount: number;
  completeness: number;
  hasData: boolean;
}

export const TEMPLATE_NAMES: Record<RoiTemplateId, string> = {
  'B_01.01': 'Entity Maintaining Register',
  'B_01.02': 'Entities in Scope',
  'B_01.03': 'Branches',
  'B_02.01': 'Contracts Overview',
  'B_02.02': 'Contract Details',
  'B_02.03': 'Linked Arrangements',
  'B_03.01': 'Entity-Contract Links',
  'B_03.02': 'Provider-Contract Links',
  'B_03.03': 'Intra-Group Links',
  'B_04.01': 'Service Recipients',
  'B_05.01': 'ICT Providers',
  'B_05.02': 'Subcontracting',
  'B_06.01': 'Critical Functions',
  'B_07.01': 'Exit Arrangements',
  'B_99.01': 'Lookup Values',
};

const TEMPLATE_GROUPS: Record<RoiTemplateId, TemplateWithStatus['group']> = {
  'B_01.01': 'entity',
  'B_01.02': 'entity',
  'B_01.03': 'entity',
  'B_02.01': 'contracts',
  'B_02.02': 'contracts',
  'B_02.03': 'contracts',
  'B_03.01': 'links',
  'B_03.02': 'links',
  'B_03.03': 'links',
  'B_04.01': 'links',
  'B_05.01': 'providers',
  'B_05.02': 'providers',
  'B_06.01': 'functions',
  'B_07.01': 'exit',
  'B_99.01': 'entity',
};

export async function fetchAllTemplateStats(): Promise<RoiStats[]> {
  // All 15 ESA-mandated templates for DORA Register of Information
  const templates: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01', 'B_99.01',
  ];

  // Fetch all templates in parallel for better performance
  const statsPromises = templates.map(async (templateId): Promise<RoiStats> => {
    const result = await fetchTemplateData(templateId);
    const mapping = TEMPLATE_MAPPINGS[templateId];

    // Calculate completeness based on required fields
    let completeness = 0; // Default to 0 for empty data

    if (result.data.length > 0) {
      if (mapping) {
        // Calculate completeness based on required fields
        const requiredFields = Object.values(mapping).filter(m => m.required);
        if (requiredFields.length > 0) {
          const filledRequired = result.data.reduce((acc, row) => {
            const filled = requiredFields.filter(f => {
              const value = row[f.esaCode];
              return value !== null && value !== undefined && value !== '';
            }).length;
            return acc + (filled / requiredFields.length);
          }, 0);
          completeness = Math.round((filledRequired / result.data.length) * 100);
        } else {
          // No required fields defined, consider 100% complete if data exists
          completeness = 100;
        }
      } else {
        // No mapping (link tables) - if data exists, consider complete
        completeness = 100;
      }
    }

    return {
      templateId,
      name: TEMPLATE_NAMES[templateId],
      rowCount: result.count,
      completeness,
      hasData: result.count > 0,
    };
  });

  return Promise.all(statsPromises);
}

// ============================================================================
// Action-Oriented Dashboard Queries
// ============================================================================

export async function getNextActions(): Promise<NextAction[]> {
  const supabase = await createClient();
  const actions: NextAction[] = [];

  // 1. Check for validation errors across templates
  const stats = await fetchAllTemplateStats();

  for (const stat of stats) {
    // Flag templates with low completeness as high priority
    if (stat.hasData && stat.completeness < 50) {
      actions.push({
        id: `validation-${stat.templateId}`,
        type: 'validation_error',
        priority: 'high',
        title: `Complete ${stat.name}`,
        description: `Only ${stat.completeness}% complete - ${stat.rowCount} records need attention`,
        templateId: stat.templateId,
        estimatedMinutes: Math.ceil((100 - stat.completeness) / 10),
        actionUrl: `/roi/${stat.templateId}`,
      });
    }

    // Empty required templates
    if (!stat.hasData && ['B_01.01', 'B_05.01', 'B_02.01'].includes(stat.templateId)) {
      actions.push({
        id: `missing-${stat.templateId}`,
        type: 'missing_data',
        priority: 'high',
        title: `Add data to ${stat.name}`,
        description: 'This required template has no data yet',
        templateId: stat.templateId,
        estimatedMinutes: 15,
        actionUrl: `/roi/${stat.templateId}`,
      });
    }
  }

  // 2. Check for vendors without contracts
  const { data: vendorsWithoutContracts } = await supabase
    .from('vendors')
    .select('id, name')
    .is('contract_id', null)
    .limit(5);

  if (vendorsWithoutContracts && vendorsWithoutContracts.length > 0) {
    actions.push({
      id: 'vendors-no-contract',
      type: 'missing_data',
      priority: 'medium',
      title: `Link ${vendorsWithoutContracts.length} vendors to contracts`,
      description: `Vendors missing contract links: ${vendorsWithoutContracts.map(v => v.name).slice(0, 3).join(', ')}${vendorsWithoutContracts.length > 3 ? '...' : ''}`,
      templateId: 'B_02.01',
      estimatedMinutes: vendorsWithoutContracts.length * 3,
      actionUrl: '/vendors',
    });
  }

  // 3. Check for parsed SOC2 documents that can populate RoI
  const { data: populatableDoc } = await supabase
    .from('parsed_soc2')
    .select(`
      id,
      document_id,
      documents!inner(file_name, vendor_id),
      vendors!inner(name)
    `)
    .limit(1);

  if (populatableDoc && populatableDoc.length > 0) {
    actions.push({
      id: 'ai-populate-available',
      type: 'ai_populate',
      priority: 'high',
      title: 'Auto-populate from SOC2 reports',
      description: 'AI can extract vendor and subcontractor data from your uploaded SOC2 reports',
      estimatedMinutes: 2,
      actionUrl: '/roi',
      metadata: { documentCount: populatableDoc.length },
    });
  }

  // 4. Quick wins - templates almost complete
  for (const stat of stats) {
    if (stat.hasData && stat.completeness >= 80 && stat.completeness < 100) {
      actions.push({
        id: `quick-win-${stat.templateId}`,
        type: 'quick_win',
        priority: 'low',
        title: `Finish ${stat.name}`,
        description: `${stat.completeness}% complete - just a few fields remaining`,
        templateId: stat.templateId,
        estimatedMinutes: Math.ceil((100 - stat.completeness) / 20),
        actionUrl: `/roi/${stat.templateId}`,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export async function getPopulatableDocuments(): Promise<PopulatableDocument[]> {
  const supabase = await createClient();

  const { data: parsedDocs, error } = await supabase
    .from('parsed_soc2')
    .select(`
      id,
      document_id,
      created_at,
      service_org_name,
      subservice_orgs,
      documents!inner(
        id,
        file_name,
        vendor_id,
        vendors(id, name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !parsedDocs) {
    console.error('Error fetching populatable documents:', error);
    return [];
  }

  return parsedDocs.map(doc => {
    const document = doc.documents as unknown as {
      id: string;
      file_name: string;
      vendor_id: string;
      vendors: { id: string; name: string } | null;
    };
    const subserviceOrgs = (doc.subservice_orgs as unknown[]) || [];

    // Calculate fields available
    const templateBreakdown: PopulatableDocument['templateBreakdown'] = [
      {
        templateId: 'B_05.01',
        fieldCount: 12,
        fieldNames: ['Provider name', 'LEI', 'Country', 'Annual expense'],
      },
      {
        templateId: 'B_02.02',
        fieldCount: 8,
        fieldNames: ['Service type', 'Start date', 'Data location'],
      },
    ];

    if (subserviceOrgs.length > 0) {
      templateBreakdown.push({
        templateId: 'B_05.02',
        fieldCount: subserviceOrgs.length * 7,
        fieldNames: subserviceOrgs.slice(0, 3).map((s: unknown) =>
          (s as { name?: string }).name || 'Subcontractor'
        ),
      });
    }

    const totalFields = templateBreakdown.reduce((sum, t) => sum + t.fieldCount, 0);

    return {
      documentId: doc.document_id,
      fileName: document.file_name,
      vendorName: document.vendors?.name || doc.service_org_name || 'Unknown Vendor',
      vendorId: document.vendor_id || '',
      parsedAt: new Date(doc.created_at),
      fieldsAvailable: totalFields,
      templateBreakdown,
      isPopulated: false, // TODO: Track in soc2_roi_mappings table
      populatedAt: undefined,
    };
  });
}

export async function getTemplatesWithStatus(): Promise<TemplateWithStatus[]> {
  const stats = await fetchAllTemplateStats();

  return stats.map(stat => {
    let status: TemplateWithStatus['status'] = 'in_progress';

    if (!stat.hasData) {
      status = 'needs_attention';
    } else if (stat.completeness === 100) {
      status = 'complete';
    } else if (stat.completeness < 50) {
      status = 'needs_attention';
    }

    return {
      ...stat,
      errorCount: stat.completeness < 100 ? Math.ceil((100 - stat.completeness) / 10) : 0,
      warningCount: 0,
      lastUpdated: null,
      status,
      group: TEMPLATE_GROUPS[stat.templateId],
    };
  });
}
