/**
 * Copilot Query Functions
 *
 * Database queries that the AI copilot can execute to answer compliance questions.
 * Each function returns structured data that Claude can interpret and explain.
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface VendorSummary {
  total: number;
  byRiskScore: Record<string, number>;
  byTier: Record<string, number>;
  withoutSoc2: number;
  withExpiredCerts: number;
  critical: Array<{ id: string; name: string; risk_score: number | null; tier: string }>;
}

export interface DocumentSummary {
  total: number;
  byType: Record<string, number>;
  expiringSoon: Array<{ id: string; name: string; vendor_name: string; expires_at: string; days_until_expiry: number }>;
  expired: Array<{ id: string; name: string; vendor_name: string; expired_at: string }>;
  withoutVendor: number;
}

export interface RoiSummary {
  overallCompletion: number;
  templateStatus: Array<{ templateId: string; name: string; recordCount: number; errorCount: number; status: 'ready' | 'incomplete' | 'empty' }>;
  missingCritical: string[];
  daysToDeadline: number;
}

export interface IncidentSummary {
  total: number;
  active: number;
  byStatus: Record<string, number>;
  overdueReports: Array<{ id: string; title: string; due_date: string; days_overdue: number }>;
  recentIncidents: Array<{ id: string; title: string; severity: string; created_at: string }>;
}

export interface ConcentrationRisk {
  singlePointsOfFailure: Array<{ vendor_id: string; vendor_name: string; critical_functions_supported: number; services_count: number }>;
  vendorsByServiceCount: Array<{ vendor_id: string; vendor_name: string; services_count: number }>;
  geographicConcentration: Record<string, number>;
}

export interface ComplianceGaps {
  vendorsWithoutContracts: Array<{ id: string; name: string }>;
  contractsWithoutExitClauses: number;
  vendorsWithoutRiskAssessment: Array<{ id: string; name: string }>;
  missingDoraClauses: Array<{ vendor_id: string; vendor_name: string; missing_clauses: string[] }>;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get vendor overview and risk summary
 */
export async function getVendorSummary(): Promise<VendorSummary> {
  const supabase = await createClient();

  // Get all vendors with correct columns
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, name, risk_score, tier, lei, supports_critical_function')
    .is('deleted_at', null);

  if (error) throw new Error(`Failed to fetch vendors: ${error.message}`);

  const vendorList = vendors || [];

  // Get vendors with valid SOC2
  const { data: docsWithSoc2 } = await supabase
    .from('documents')
    .select('vendor_id')
    .eq('document_type', 'soc2')
    .gte('valid_until', new Date().toISOString());

  const vendorsWithSoc2 = new Set((docsWithSoc2 || []).map(d => d.vendor_id));

  // Get vendors with expired certs
  const { data: expiredDocs } = await supabase
    .from('documents')
    .select('vendor_id')
    .in('document_type', ['soc2', 'iso27001'])
    .lt('valid_until', new Date().toISOString());

  const vendorsWithExpired = new Set((expiredDocs || []).map(d => d.vendor_id));

  // Aggregate by risk score categories and tier
  const byRiskScore: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0, unassessed: 0 };
  const byTier: Record<string, number> = {};

  vendorList.forEach(v => {
    // Categorize by risk score (0-100 scale assumed)
    const score = v.risk_score;
    if (score === null || score === undefined) {
      byRiskScore['unassessed']++;
    } else if (score >= 75) {
      byRiskScore['critical']++;
    } else if (score >= 50) {
      byRiskScore['high']++;
    } else if (score >= 25) {
      byRiskScore['medium']++;
    } else {
      byRiskScore['low']++;
    }
    byTier[v.tier || 'standard'] = (byTier[v.tier || 'standard'] || 0) + 1;
  });

  // Get critical vendors (critical tier or high risk score or supports critical functions)
  const critical = vendorList
    .filter(v => v.tier === 'critical' || (v.risk_score && v.risk_score >= 50) || v.supports_critical_function)
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 10)
    .map(v => ({ id: v.id, name: v.name, risk_score: v.risk_score, tier: v.tier || 'standard' }));

  return {
    total: vendorList.length,
    byRiskScore,
    byTier,
    withoutSoc2: vendorList.filter(v => !vendorsWithSoc2.has(v.id)).length,
    withExpiredCerts: vendorList.filter(v => vendorsWithExpired.has(v.id)).length,
    critical,
  };
}

/**
 * Get document status and expiration overview
 */
export async function getDocumentSummary(): Promise<DocumentSummary> {
  const supabase = await createClient();

  // Get all documents
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, filename, type, vendor_id, metadata, created_at');

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`);

  const docList = documents || [];

  // Get vendor names for documents with vendor_id
  const vendorIds = [...new Set(docList.filter(d => d.vendor_id).map(d => d.vendor_id))];
  let vendorMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, name')
      .in('id', vendorIds);
    vendorMap = (vendors || []).reduce((acc, v) => ({ ...acc, [v.id]: v.name }), {});
  }

  // Count by type
  const byType: Record<string, number> = {};
  docList.forEach(d => {
    byType[d.type || 'other'] = (byType[d.type || 'other'] || 0) + 1;
  });

  // For documents without valid_until, we'll report based on metadata
  // Check metadata for expiration info
  const docsWithExpiry = docList.filter(d => {
    const meta = d.metadata as { valid_until?: string } | null;
    return meta?.valid_until;
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find expiring soon (within 30 days) from metadata
  const expiringSoon = docsWithExpiry
    .filter(d => {
      const validUntil = (d.metadata as { valid_until?: string })?.valid_until;
      if (!validUntil) return false;
      const date = new Date(validUntil);
      return date > now && date <= thirtyDaysFromNow;
    })
    .map(d => {
      const validUntil = (d.metadata as { valid_until?: string })?.valid_until!;
      return {
        id: d.id,
        name: d.filename,
        vendor_name: d.vendor_id ? (vendorMap[d.vendor_id] || 'Unknown') : 'No vendor',
        expires_at: validUntil,
        days_until_expiry: Math.ceil((new Date(validUntil).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      };
    })
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
    .slice(0, 10);

  // Find expired from metadata
  const expired = docsWithExpiry
    .filter(d => {
      const validUntil = (d.metadata as { valid_until?: string })?.valid_until;
      if (!validUntil) return false;
      return new Date(validUntil) < now;
    })
    .map(d => ({
      id: d.id,
      name: d.filename,
      vendor_name: d.vendor_id ? (vendorMap[d.vendor_id] || 'Unknown') : 'No vendor',
      expired_at: (d.metadata as { valid_until?: string })?.valid_until!,
    }))
    .slice(0, 10);

  return {
    total: docList.length,
    byType,
    expiringSoon,
    expired,
    withoutVendor: docList.filter(d => !d.vendor_id).length,
  };
}

/**
 * Get RoI completion status
 */
export async function getRoiSummary(): Promise<RoiSummary> {
  const supabase = await createClient();

  // Template definitions
  const templates = [
    { id: 'B_01.01', name: 'Entity Maintaining Register', critical: true },
    { id: 'B_01.02', name: 'Entities in Scope', critical: true },
    { id: 'B_01.03', name: 'Branches', critical: false },
    { id: 'B_02.01', name: 'Contracts Overview', critical: true },
    { id: 'B_02.02', name: 'ICT Services', critical: true },
    { id: 'B_05.01', name: 'ICT Providers', critical: true },
    { id: 'B_06.01', name: 'Critical Functions', critical: true },
    { id: 'B_07.01', name: 'Exit Arrangements', critical: false },
  ];

  // Get counts for each template's primary table
  const tableCounts: Record<string, number> = {};

  const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).is('deleted_at', null);
  const { count: contractCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).is('deleted_at', null);
  const { count: serviceCount } = await supabase.from('ict_services').select('*', { count: 'exact', head: true });
  const { count: functionCount } = await supabase.from('critical_functions').select('*', { count: 'exact', head: true });
  const { count: branchCount } = await supabase.from('organization_branches').select('*', { count: 'exact', head: true });
  const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });

  tableCounts['B_01.01'] = orgCount || 0;
  tableCounts['B_01.02'] = orgCount || 0;
  tableCounts['B_01.03'] = branchCount || 0;
  tableCounts['B_02.01'] = contractCount || 0;
  tableCounts['B_02.02'] = serviceCount || 0;
  tableCounts['B_05.01'] = vendorCount || 0;
  tableCounts['B_06.01'] = functionCount || 0;
  tableCounts['B_07.01'] = contractCount || 0;

  // Build template status
  const templateStatus = templates.map(t => {
    const count = tableCounts[t.id] || 0;
    let status: 'ready' | 'incomplete' | 'empty' = 'empty';
    if (count > 0) {
      status = t.critical && count < 1 ? 'incomplete' : 'ready';
    }
    return {
      templateId: t.id,
      name: t.name,
      recordCount: count,
      errorCount: 0, // Would need validation check
      status,
    };
  });

  // Calculate completion
  const readyCount = templateStatus.filter(t => t.status === 'ready').length;
  const overallCompletion = Math.round((readyCount / templates.length) * 100);

  // Find missing critical templates
  const missingCritical = templates
    .filter(t => t.critical && (tableCounts[t.id] || 0) === 0)
    .map(t => t.name);

  // Days to deadline (April 30, 2025)
  const deadline = new Date('2025-04-30');
  const daysToDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));

  return {
    overallCompletion,
    templateStatus,
    missingCritical,
    daysToDeadline,
  };
}

/**
 * Get incident overview
 */
export async function getIncidentSummary(): Promise<IncidentSummary> {
  const supabase = await createClient();
  const now = new Date();

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('id, title, classification, status, created_at, detection_datetime, resolution_datetime')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch incidents: ${error.message}`);

  const incidentList = incidents || [];

  // Count by status
  const byStatus: Record<string, number> = {};
  incidentList.forEach(i => {
    byStatus[i.status || 'unknown'] = (byStatus[i.status || 'unknown'] || 0) + 1;
  });

  // Find incidents that might be overdue (open incidents older than 72 hours for major, 1 week for others)
  const overdueReports = incidentList
    .filter(i => {
      if (i.status === 'resolved') return false;
      const created = new Date(i.detection_datetime || i.created_at);
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      // Major incidents need initial report in 4 hours, intermediate in 72 hours
      // We'll flag any open incident older than 72 hours as potentially overdue
      return hoursSinceCreation > 72;
    })
    .map(i => {
      const created = new Date(i.detection_datetime || i.created_at);
      const hoursOverdue = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60)) - 72;
      return {
        id: i.id,
        title: i.title,
        due_date: new Date(created.getTime() + 72 * 60 * 60 * 1000).toISOString(),
        days_overdue: Math.ceil(hoursOverdue / 24),
      };
    })
    .slice(0, 5);

  // Recent incidents
  const recentIncidents = incidentList.slice(0, 5).map(i => ({
    id: i.id,
    title: i.title,
    severity: i.classification || 'unknown',
    created_at: i.created_at,
  }));

  return {
    total: incidentList.length,
    active: incidentList.filter(i => i.status !== 'resolved').length,
    byStatus,
    overdueReports,
    recentIncidents,
  };
}

/**
 * Get concentration risk analysis
 */
export async function getConcentrationRisk(): Promise<ConcentrationRisk> {
  const supabase = await createClient();

  // Get all vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, headquarters_country, supports_critical_function')
    .is('deleted_at', null);

  const vendorList = vendors || [];

  // Get service counts per vendor
  const { data: services } = await supabase
    .from('ict_services')
    .select('provider_id');

  const serviceCountByVendor: Record<string, number> = {};
  (services || []).forEach(s => {
    if (s.provider_id) {
      serviceCountByVendor[s.provider_id] = (serviceCountByVendor[s.provider_id] || 0) + 1;
    }
  });

  // Get critical function counts per vendor
  const { data: functions } = await supabase
    .from('critical_functions')
    .select('vendor_id');

  const functionCountByVendor: Record<string, number> = {};
  (functions || []).forEach(f => {
    if (f.vendor_id) {
      functionCountByVendor[f.vendor_id] = (functionCountByVendor[f.vendor_id] || 0) + 1;
    }
  });

  // Find single points of failure (vendors supporting critical functions)
  const singlePointsOfFailure = vendorList
    .filter(v => (functionCountByVendor[v.id] || 0) > 0 || v.supports_critical_function)
    .map(v => ({
      vendor_id: v.id,
      vendor_name: v.name,
      critical_functions_supported: functionCountByVendor[v.id] || 0,
      services_count: serviceCountByVendor[v.id] || 0,
    }))
    .sort((a, b) => b.critical_functions_supported - a.critical_functions_supported)
    .slice(0, 10);

  // Vendors by service count
  const vendorsByServiceCount = vendorList
    .map(v => ({
      vendor_id: v.id,
      vendor_name: v.name,
      services_count: serviceCountByVendor[v.id] || 0,
    }))
    .sort((a, b) => b.services_count - a.services_count)
    .slice(0, 10);

  // Geographic concentration
  const geographicConcentration: Record<string, number> = {};
  vendorList.forEach(v => {
    const country = v.headquarters_country || 'Unknown';
    geographicConcentration[country] = (geographicConcentration[country] || 0) + 1;
  });

  return {
    singlePointsOfFailure,
    vendorsByServiceCount,
    geographicConcentration,
  };
}

/**
 * Get compliance gaps
 */
export async function getComplianceGaps(): Promise<ComplianceGaps> {
  const supabase = await createClient();

  // Vendors without contracts
  const { data: vendorsWithContracts } = await supabase
    .from('contracts')
    .select('vendor_id')
    .not('vendor_id', 'is', null);

  const vendorIdsWithContracts = new Set((vendorsWithContracts || []).map(c => c.vendor_id));

  const { data: allVendors } = await supabase
    .from('vendors')
    .select('id, name, risk_score')
    .is('deleted_at', null);

  const vendorsWithoutContracts = (allVendors || [])
    .filter(v => !vendorIdsWithContracts.has(v.id))
    .slice(0, 10);

  // Vendors without risk assessment (no risk_score set)
  const vendorsWithoutRiskAssessment = (allVendors || [])
    .filter(v => v.risk_score === null || v.risk_score === undefined)
    .slice(0, 10);

  return {
    vendorsWithoutContracts,
    contractsWithoutExitClauses: 0, // Would need contract analysis
    vendorsWithoutRiskAssessment,
    missingDoraClauses: [], // Would need contract analysis
  };
}

/**
 * Search vendors by name or criteria
 */
export async function searchVendors(query: string): Promise<Array<{ id: string; name: string; risk_score: number | null; tier: string }>> {
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, risk_score, tier')
    .is('deleted_at', null)
    .ilike('name', `%${query}%`)
    .limit(10);

  return (vendors || []).map(v => ({
    id: v.id,
    name: v.name,
    risk_score: v.risk_score,
    tier: v.tier || 'standard',
  }));
}

/**
 * Get specific vendor details
 */
export async function getVendorDetails(vendorId: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();

  // Get vendor basic info
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (!vendor) return null;

  // Get related documents
  const { data: documents } = await supabase
    .from('documents')
    .select('id, filename, type, created_at')
    .eq('vendor_id', vendorId);

  // Get related contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_ref, contract_type, annual_value')
    .eq('vendor_id', vendorId);

  // Get related ICT services
  const { data: ictServices } = await supabase
    .from('ict_services')
    .select('id, service_name, service_type')
    .eq('provider_id', vendorId);

  // Get related critical functions
  const { data: criticalFunctions } = await supabase
    .from('critical_functions')
    .select('id, function_name, is_critical')
    .eq('vendor_id', vendorId);

  return {
    ...vendor,
    documents: documents || [],
    contracts: contracts || [],
    ict_services: ictServices || [],
    critical_functions: criticalFunctions || [],
  };
}
