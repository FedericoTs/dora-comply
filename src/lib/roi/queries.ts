/**
 * RoI Data Queries
 *
 * Server-side queries to fetch data for ESA templates
 */

import { createClient } from '@/lib/supabase/server';
import type { RoiTemplateId } from './types';
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
    c0090: null, // No deletion tracking yet
    c0100: mapToEbaCurrency('EUR'),
    c0110: null, // Total assets not tracked yet
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
    `);

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
    .select('contract_ref, contract_type, annual_value, currency')
    .order('created_at');

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (contracts || []).map(c => ({
    c0010: c.contract_ref || '',
    c0020: mapContractType(c.contract_type),
    c0030: null, // Parent contract ref not implemented yet
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
        dora_provisions
      ),
      vendor:vendors(lei, headquarters_country),
      organization:organizations(lei),
      data_locations:service_data_locations(country_code, location_type)
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (services || []).map(s => {
    const contract = s.contract as {
      contract_ref?: string;
      effective_date?: string;
      expiry_date?: string;
      termination_notice_days?: number;
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
      c0110: null, // Provider notice period
      c0120: mapToEbaCountry(vendor?.headquarters_country),
      c0130: mapToEbaCountry(vendor?.headquarters_country),
      c0140: s.processes_personal_data || false,
      c0150: storageLocation ? mapToEbaCountry(storageLocation.country_code) : null,
      c0160: processingLocation ? mapToEbaCountry(processingLocation.country_code) : null,
      c0170: mapToEbaSensitiveness(s.criticality_level),
      c0180: s.criticality_level,
    };
  });

  return { data: rows, count: rows.length, error: null };
}

// ============================================================================
// B_02.03 - Linked Contractual Arrangements
// ============================================================================

export async function fetchB_02_03(): Promise<QueryResult<Record<string, unknown>>> {
  // This template links related contracts - currently not implemented
  // Would need a contract_links table or similar
  return { data: [], count: 0, error: null };
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
    `);

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
    .order('created_at');

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (vendors || []).map(v => ({
    c0010: v.lei || v.id,
    c0020: 'eba_qCO:qx2000', // LEI code type
    c0030: v.registration_number || null,
    c0040: v.registration_number ? 'eba_qCO:qx2001' : null,
    c0050: v.name || '',
    c0060: v.name || '', // Latin alphabet name
    c0070: 'eba_CT:x212', // Legal person
    c0080: mapToEbaCountry(v.headquarters_country),
    c0090: mapToEbaCurrency('EUR'),
    c0100: null, // Total annual expense
    c0110: null, // Parent LEI
    c0120: null, // Parent code type
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
    `);

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
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (functions || []).map(f => {
    const organization = f.organization as { lei?: string };
    const mappings = f.mappings as Array<{ service?: { rto_hours?: number; rpo_hours?: number } }>;
    const firstService = mappings?.[0]?.service;

    return {
      c0010: f.function_code || f.id,
      c0020: f.function_category || '',
      c0030: f.function_name || '',
      c0040: organization?.lei || '',
      c0050: mapToEbaCriticality(f.is_critical),
      c0060: f.criticality_rationale || null,
      c0070: formatDate(f.updated_at),
      c0080: firstService?.rto_hours || null,
      c0090: firstService?.rpo_hours || null,
      c0100: mapToEbaImpact('medium'), // Default to medium
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
      contract:contracts(contract_ref, dora_provisions),
      vendor:vendors(lei, last_assessment_date),
      mappings:function_service_mapping(substitutability)
    `);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  const rows = (services || []).map(s => {
    const contract = s.contract as { contract_ref?: string; dora_provisions?: Record<string, unknown> };
    const vendor = s.vendor as { lei?: string; last_assessment_date?: string };
    const mappings = s.mappings as Array<{ substitutability?: string }>;
    const provisions = contract?.dora_provisions || {};

    return {
      c0010: contract?.contract_ref || '',
      c0020: vendor?.lei || '',
      c0030: 'eba_qCO:qx2000', // LEI code type
      c0040: mapToEbaServiceType(s.service_type),
      c0050: mapToEbaSubstitutability(mappings?.[0]?.substitutability || 'easily_substitutable'),
      c0060: null, // Reason if not substitutable
      c0070: formatDate(vendor?.last_assessment_date),
      c0080: Boolean(provisions.exit_strategy),
      c0090: mapToEbaReintegration('easy'),
      c0100: mapToEbaImpact(s.criticality_level || 'low'),
      c0110: false, // Alternatives identified
      c0120: null, // Alternative provider
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

export async function fetchAllTemplateStats(): Promise<RoiStats[]> {
  const templates: RoiTemplateId[] = [
    'B_01.01', 'B_01.02', 'B_01.03',
    'B_02.01', 'B_02.02', 'B_02.03',
    'B_03.01', 'B_03.02', 'B_03.03',
    'B_04.01', 'B_05.01', 'B_05.02',
    'B_06.01', 'B_07.01',
  ];

  const templateNames: Record<RoiTemplateId, string> = {
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

  const stats: RoiStats[] = [];

  for (const templateId of templates) {
    const result = await fetchTemplateData(templateId);
    const mapping = TEMPLATE_MAPPINGS[templateId];

    // Calculate completeness based on required fields
    let completeness = 100;
    if (result.data.length > 0 && mapping) {
      const requiredFields = Object.values(mapping).filter(m => m.required);
      const filledRequired = result.data.reduce((acc, row) => {
        const filled = requiredFields.filter(f => {
          const value = row[f.esaCode];
          return value !== null && value !== undefined && value !== '';
        }).length;
        return acc + (filled / requiredFields.length);
      }, 0);
      completeness = result.data.length > 0
        ? Math.round((filledRequired / result.data.length) * 100)
        : 0;
    }

    stats.push({
      templateId,
      name: templateNames[templateId],
      rowCount: result.count,
      completeness,
      hasData: result.count > 0,
    });
  }

  return stats;
}
