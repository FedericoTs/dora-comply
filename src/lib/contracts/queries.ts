/**
 * Contract Queries
 * Server-side data fetching for contracts and lifecycle data
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import type {
  Contract,
  ContractWithLifecycle,
  ContractClause,
  ContractAlert,
  ContractRenewal,
  ContractVersion,
  ContractStatus,
  ContractCriticality,
  ContractCategory,
  AlertStatus,
  DoraProvisions,
} from './types';

// ============================================================================
// Contract List Queries
// ============================================================================

export interface ContractFilters {
  status?: ContractStatus | 'all';
  criticality?: ContractCriticality | 'all';
  category?: ContractCategory | 'all';
  vendorId?: string;
  hasActiveAlerts?: boolean;
  expiringWithinDays?: number;
  search?: string;
}

export interface ContractListResult {
  contracts: ContractWithLifecycle[];
  total: number;
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    draft: number;
    activeAlerts: number;
    pendingRenewals: number;
    totalValue: number;
  };
}

export async function getContractsWithLifecycle(
  filters: ContractFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<ContractListResult> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return {
      contracts: [],
      total: 0,
      stats: {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        draft: 0,
        activeAlerts: 0,
        pendingRenewals: 0,
        totalValue: 0,
      },
    };
  }

  // Build base query
  let query = supabase
    .from('contracts')
    .select(`
      *,
      vendors!inner(id, name, lei, tier),
      owner:users!contracts_owner_id_fkey(id, full_name, email)
    `, { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.criticality && filters.criticality !== 'all') {
    query = query.eq('criticality', filters.criticality);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId);
  }

  if (filters.expiringWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
    query = query.lte('expiry_date', futureDate.toISOString().split('T')[0]);
    query = query.gte('expiry_date', new Date().toISOString().split('T')[0]);
  }

  if (filters.search) {
    query = query.or(`contract_ref.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('expiry_date', { ascending: true, nullsFirst: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Get contracts error:', error);
    return {
      contracts: [],
      total: 0,
      stats: {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        draft: 0,
        activeAlerts: 0,
        pendingRenewals: 0,
        totalValue: 0,
      },
    };
  }

  // Get counts for clauses, alerts, renewals
  const contractIds = (data || []).map((c) => c.id);

  const [clauseCounts, alertCounts, renewalCounts] = await Promise.all([
    getClauseCounts(organizationId, contractIds),
    getActiveAlertCounts(organizationId, contractIds),
    getPendingRenewalCounts(organizationId, contractIds),
  ]);

  // Map contracts with lifecycle data
  const contracts: ContractWithLifecycle[] = (data || []).map((row) => ({
    ...mapContractExtendedFromDatabase(row),
    vendor: row.vendors as ContractWithLifecycle['vendor'],
    owner: row.owner as ContractWithLifecycle['owner'],
    clauses_count: clauseCounts[row.id] || 0,
    active_alerts_count: alertCounts[row.id] || 0,
    pending_renewals_count: renewalCounts[row.id] || 0,
  }));

  // Get stats
  const stats = await getContractStats(organizationId);

  return {
    contracts,
    total: count || 0,
    stats,
  };
}

async function getClauseCounts(
  organizationId: string,
  contractIds: string[]
): Promise<Record<string, number>> {
  if (contractIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from('contract_clauses')
    .select('contract_id')
    .eq('organization_id', organizationId)
    .in('contract_id', contractIds);

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    counts[row.contract_id] = (counts[row.contract_id] || 0) + 1;
  });
  return counts;
}

async function getActiveAlertCounts(
  organizationId: string,
  contractIds: string[]
): Promise<Record<string, number>> {
  if (contractIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from('contract_alerts')
    .select('contract_id')
    .eq('organization_id', organizationId)
    .in('contract_id', contractIds)
    .in('status', ['triggered', 'acknowledged']);

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    counts[row.contract_id] = (counts[row.contract_id] || 0) + 1;
  });
  return counts;
}

async function getPendingRenewalCounts(
  organizationId: string,
  contractIds: string[]
): Promise<Record<string, number>> {
  if (contractIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from('contract_renewals')
    .select('contract_id')
    .eq('organization_id', organizationId)
    .in('contract_id', contractIds)
    .in('status', ['pending', 'under_review']);

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    counts[row.contract_id] = (counts[row.contract_id] || 0) + 1;
  });
  return counts;
}

async function getContractStats(organizationId: string) {
  const supabase = await createClient();

  // Get contract counts by status
  const { data: contracts } = await supabase
    .from('contracts')
    .select('status, annual_value')
    .eq('organization_id', organizationId);

  // Get active alerts count
  const { count: alertsCount } = await supabase
    .from('contract_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['triggered', 'acknowledged']);

  // Get pending renewals count
  const { count: renewalsCount } = await supabase
    .from('contract_renewals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'under_review']);

  const stats = {
    total: contracts?.length || 0,
    active: 0,
    expiring: 0,
    expired: 0,
    draft: 0,
    activeAlerts: alertsCount || 0,
    pendingRenewals: renewalsCount || 0,
    totalValue: 0,
  };

  (contracts || []).forEach((c) => {
    switch (c.status) {
      case 'active':
        stats.active++;
        break;
      case 'expiring':
        stats.expiring++;
        break;
      case 'expired':
        stats.expired++;
        break;
      case 'draft':
        stats.draft++;
        break;
    }
    if (c.annual_value) {
      stats.totalValue += c.annual_value;
    }
  });

  return stats;
}

// ============================================================================
// Single Contract with Full Lifecycle
// ============================================================================

export interface ContractDetail extends ContractWithLifecycle {
  clauses: ContractClause[];
  alerts: ContractAlert[];
  renewals: ContractRenewal[];
  versions: ContractVersion[];
}

export async function getContractDetail(contractId: string): Promise<ContractDetail | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return null;
  }

  // Get contract with vendor
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      vendors!inner(id, name, lei, tier),
      owner:users!contracts_owner_id_fkey(id, full_name, email)
    `)
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !contract) {
    return null;
  }

  // Get related data in parallel
  const [clauses, alerts, renewals, versions] = await Promise.all([
    getContractClauses(contractId, organizationId),
    getContractAlerts(contractId, organizationId),
    getContractRenewals(contractId, organizationId),
    getContractVersions(contractId, organizationId),
  ]);

  return {
    ...mapContractExtendedFromDatabase(contract),
    vendor: contract.vendors as ContractWithLifecycle['vendor'],
    owner: contract.owner as ContractWithLifecycle['owner'],
    clauses_count: clauses.length,
    active_alerts_count: alerts.filter((a) => ['triggered', 'acknowledged'].includes(a.status)).length,
    pending_renewals_count: renewals.filter((r) => ['pending', 'under_review'].includes(r.status)).length,
    clauses,
    alerts,
    renewals,
    versions,
  };
}

// ============================================================================
// Contract Clauses
// ============================================================================

export async function getContractClauses(
  contractId: string,
  organizationId?: string
): Promise<ContractClause[]> {
  const supabase = await createClient();
  const orgId = organizationId || (await getCurrentUserOrganization());

  if (!orgId) return [];

  const { data, error } = await supabase
    .from('contract_clauses')
    .select('*')
    .eq('contract_id', contractId)
    .eq('organization_id', orgId)
    .order('clause_type');

  if (error) {
    console.error('Get clauses error:', error);
    return [];
  }

  return (data || []).map(mapClauseFromDatabase);
}

// ============================================================================
// Contract Alerts
// ============================================================================

export async function getContractAlerts(
  contractId: string,
  organizationId?: string
): Promise<ContractAlert[]> {
  const supabase = await createClient();
  const orgId = organizationId || (await getCurrentUserOrganization());

  if (!orgId) return [];

  const { data, error } = await supabase
    .from('contract_alerts')
    .select('*')
    .eq('contract_id', contractId)
    .eq('organization_id', orgId)
    .order('trigger_date', { ascending: true });

  if (error) {
    console.error('Get alerts error:', error);
    return [];
  }

  return (data || []).map(mapAlertFromDatabase);
}

export async function getActiveAlerts(
  statusFilter: AlertStatus[] = ['triggered', 'acknowledged'],
  limit: number = 10
): Promise<(ContractAlert & { contract: { id: string; contract_ref: string; vendor_name: string } })[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('contract_alerts')
    .select(`
      *,
      contracts!inner(id, contract_ref, vendors!inner(name))
    `)
    .eq('organization_id', organizationId)
    .in('status', statusFilter)
    .order('priority', { ascending: false })
    .order('trigger_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Get active alerts error:', error);
    return [];
  }

  return (data || []).map((row) => ({
    ...mapAlertFromDatabase(row),
    contract: {
      id: row.contracts.id,
      contract_ref: row.contracts.contract_ref,
      vendor_name: row.contracts.vendors.name,
    },
  }));
}

// ============================================================================
// Contract Renewals
// ============================================================================

export async function getContractRenewals(
  contractId: string,
  organizationId?: string
): Promise<ContractRenewal[]> {
  const supabase = await createClient();
  const orgId = organizationId || (await getCurrentUserOrganization());

  if (!orgId) return [];

  const { data, error } = await supabase
    .from('contract_renewals')
    .select('*')
    .eq('contract_id', contractId)
    .eq('organization_id', orgId)
    .order('renewal_number', { ascending: false });

  if (error) {
    console.error('Get renewals error:', error);
    return [];
  }

  return (data || []).map(mapRenewalFromDatabase);
}

export async function getPendingRenewals(
  limit: number = 10
): Promise<(ContractRenewal & { contract: { id: string; contract_ref: string; vendor_name: string } })[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('contract_renewals')
    .select(`
      *,
      contracts!inner(id, contract_ref, vendors!inner(name))
    `)
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'under_review'])
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Get pending renewals error:', error);
    return [];
  }

  return (data || []).map((row) => ({
    ...mapRenewalFromDatabase(row),
    contract: {
      id: row.contracts.id,
      contract_ref: row.contracts.contract_ref,
      vendor_name: row.contracts.vendors.name,
    },
  }));
}

// ============================================================================
// Contract Versions
// ============================================================================

export async function getContractVersions(
  contractId: string,
  organizationId?: string
): Promise<ContractVersion[]> {
  const supabase = await createClient();
  const orgId = organizationId || (await getCurrentUserOrganization());

  if (!orgId) return [];

  const { data, error } = await supabase
    .from('contract_versions')
    .select('*')
    .eq('contract_id', contractId)
    .eq('organization_id', orgId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Get versions error:', error);
    return [];
  }

  return (data || []).map(mapVersionFromDatabase);
}

// ============================================================================
// Calendar View
// ============================================================================

export interface CalendarEvent {
  id: string;
  date: string;
  type: 'expiry' | 'renewal' | 'review' | 'alert';
  title: string;
  contractId: string;
  contractRef: string;
  vendorName: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export async function getContractCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) return [];

  const events: CalendarEvent[] = [];

  // Get contracts with expiry dates in range
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      id, contract_ref, expiry_date, next_review_date,
      vendors!inner(name)
    `)
    .eq('organization_id', organizationId)
    .gte('expiry_date', startDate)
    .lte('expiry_date', endDate);

  (contracts || []).forEach((c) => {
    const vendorName = (c.vendors as unknown as { name: string }).name;
    if (c.expiry_date) {
      events.push({
        id: `expiry-${c.id}`,
        date: c.expiry_date,
        type: 'expiry',
        title: `Contract expires: ${c.contract_ref}`,
        contractId: c.id,
        contractRef: c.contract_ref,
        vendorName,
        priority: 'high',
      });
    }
    if (c.next_review_date && c.next_review_date >= startDate && c.next_review_date <= endDate) {
      events.push({
        id: `review-${c.id}`,
        date: c.next_review_date,
        type: 'review',
        title: `Review due: ${c.contract_ref}`,
        contractId: c.id,
        contractRef: c.contract_ref,
        vendorName,
        priority: 'medium',
      });
    }
  });

  // Get scheduled alerts in range
  const { data: alerts } = await supabase
    .from('contract_alerts')
    .select(`
      id, trigger_date, title, priority, contract_id,
      contracts!inner(contract_ref, vendors!inner(name))
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'scheduled')
    .gte('trigger_date', startDate)
    .lte('trigger_date', endDate);

  (alerts || []).forEach((a) => {
    const contract = a.contracts as unknown as { contract_ref: string; vendors: { name: string } };
    events.push({
      id: `alert-${a.id}`,
      date: a.trigger_date,
      type: 'alert',
      title: a.title,
      contractId: a.contract_id,
      contractRef: contract.contract_ref,
      vendorName: contract.vendors.name,
      priority: a.priority,
    });
  });

  // Get renewal due dates in range
  const { data: renewals } = await supabase
    .from('contract_renewals')
    .select(`
      id, due_date, contract_id,
      contracts!inner(contract_ref, vendors!inner(name))
    `)
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'under_review'])
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  (renewals || []).forEach((r) => {
    if (r.due_date) {
      const contract = r.contracts as unknown as { contract_ref: string; vendors: { name: string } };
      events.push({
        id: `renewal-${r.id}`,
        date: r.due_date,
        type: 'renewal',
        title: `Renewal decision due: ${contract.contract_ref}`,
        contractId: r.contract_id,
        contractRef: contract.contract_ref,
        vendorName: contract.vendors.name,
        priority: 'high',
      });
    }
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// Mappers
// ============================================================================

function mapContractExtendedFromDatabase(row: Record<string, unknown>): Omit<ContractWithLifecycle, 'vendor' | 'owner'> {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    vendor_id: row.vendor_id as string,
    contract_ref: row.contract_ref as string,
    contract_type: row.contract_type as Contract['contract_type'],
    signature_date: row.signature_date as string | null,
    effective_date: row.effective_date as string,
    expiry_date: row.expiry_date as string | null,
    auto_renewal: row.auto_renewal as boolean,
    termination_notice_days: row.termination_notice_days as number | null,
    last_renewal_date: row.last_renewal_date as string | null,
    dora_provisions: (row.dora_provisions as DoraProvisions) || {
      article_30_2: {
        service_description: { status: 'missing' },
        data_locations: { status: 'missing' },
        data_protection: { status: 'missing' },
        availability_guarantees: { status: 'missing' },
        incident_support: { status: 'missing' },
        authority_cooperation: { status: 'missing' },
        termination_rights: { status: 'missing' },
        subcontracting_conditions: { status: 'missing' },
      },
    },
    annual_value: row.annual_value as number | null,
    total_value: row.total_value as number | null,
    currency: row.currency as string,
    document_ids: (row.document_ids as string[]) || [],
    status: row.status as Contract['status'],
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    // Extended fields
    next_review_date: row.next_review_date as string | null,
    owner_id: row.owner_id as string | null,
    criticality: row.criticality as ContractWithLifecycle['criticality'],
    category: row.category as ContractWithLifecycle['category'],
    ai_analyzed_at: row.ai_analyzed_at as string | null,
    clauses_extracted: row.clauses_extracted as boolean || false,
  };
}

function mapClauseFromDatabase(row: Record<string, unknown>): ContractClause {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    contract_id: row.contract_id as string,
    clause_type: row.clause_type as ContractClause['clause_type'],
    title: row.title as string,
    summary: row.summary as string | null,
    full_text: row.full_text as string | null,
    location: row.location as string | null,
    ai_extracted: row.ai_extracted as boolean,
    ai_confidence: row.ai_confidence as number | null,
    extracted_at: row.extracted_at as string | null,
    risk_level: row.risk_level as ContractClause['risk_level'],
    risk_notes: row.risk_notes as string | null,
    effective_date: row.effective_date as string | null,
    expiry_date: row.expiry_date as string | null,
    notice_period_days: row.notice_period_days as number | null,
    liability_cap: row.liability_cap as number | null,
    liability_cap_currency: row.liability_cap_currency as string || 'EUR',
    dora_relevant: row.dora_relevant as boolean,
    nis2_relevant: row.nis2_relevant as boolean,
    gdpr_relevant: row.gdpr_relevant as boolean,
    review_status: row.review_status as ContractClause['review_status'],
    reviewed_by: row.reviewed_by as string | null,
    reviewed_at: row.reviewed_at as string | null,
    review_notes: row.review_notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapAlertFromDatabase(row: Record<string, unknown>): ContractAlert {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    contract_id: row.contract_id as string,
    alert_type: row.alert_type as ContractAlert['alert_type'],
    title: row.title as string,
    description: row.description as string | null,
    priority: row.priority as ContractAlert['priority'],
    trigger_date: row.trigger_date as string,
    triggered_at: row.triggered_at as string | null,
    status: row.status as ContractAlert['status'],
    assigned_to: row.assigned_to as string | null,
    acknowledged_by: row.acknowledged_by as string | null,
    acknowledged_at: row.acknowledged_at as string | null,
    resolved_by: row.resolved_by as string | null,
    resolved_at: row.resolved_at as string | null,
    resolution_notes: row.resolution_notes as string | null,
    snoozed_until: row.snoozed_until as string | null,
    snooze_count: row.snooze_count as number || 0,
    notification_sent: row.notification_sent as boolean,
    notification_sent_at: row.notification_sent_at as string | null,
    email_sent: row.email_sent as boolean,
    renewal_id: row.renewal_id as string | null,
    clause_id: row.clause_id as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapRenewalFromDatabase(row: Record<string, unknown>): ContractRenewal {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    contract_id: row.contract_id as string,
    renewal_number: row.renewal_number as number,
    renewal_type: row.renewal_type as ContractRenewal['renewal_type'],
    previous_expiry_date: row.previous_expiry_date as string,
    new_expiry_date: row.new_expiry_date as string | null,
    decision_date: row.decision_date as string | null,
    notice_sent_date: row.notice_sent_date as string | null,
    status: row.status as ContractRenewal['status'],
    decision_by: row.decision_by as string | null,
    decision_notes: row.decision_notes as string | null,
    value_change: row.value_change as number | null,
    value_change_percent: row.value_change_percent as number | null,
    terms_changed: row.terms_changed as boolean,
    terms_change_summary: row.terms_change_summary as string | null,
    new_contract_id: row.new_contract_id as string | null,
    assigned_to: row.assigned_to as string | null,
    due_date: row.due_date as string | null,
    reminder_sent: row.reminder_sent as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapVersionFromDatabase(row: Record<string, unknown>): ContractVersion {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    contract_id: row.contract_id as string,
    version_number: row.version_number as number,
    version_type: row.version_type as ContractVersion['version_type'],
    document_id: row.document_id as string | null,
    effective_date: row.effective_date as string,
    supersedes_version: row.supersedes_version as number | null,
    change_summary: row.change_summary as string | null,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
  };
}
