/**
 * Remediation Queries
 * Server-side data fetching for remediation plans and actions
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import type {
  RemediationPlan,
  RemediationPlanWithRelations,
  RemediationAction,
  RemediationActionWithRelations,
  RemediationStats,
  KanbanData,
  PlanStatus,
  ActionStatus,
  Priority,
  Framework,
  KANBAN_COLUMNS,
} from './types';

// ============================================================================
// Plan Queries
// ============================================================================

export interface PlanFilters {
  status?: PlanStatus | 'all';
  priority?: Priority | 'all';
  framework?: Framework | 'all';
  vendorId?: string;
  ownerId?: string;
  search?: string;
  includeCompleted?: boolean;
}

export async function getRemediationPlans(
  filters: PlanFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ plans: RemediationPlanWithRelations[]; total: number }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { plans: [], total: 0 };
  }

  let query = supabase
    .from('remediation_plans')
    .select(`
      *,
      vendor:vendors(id, name),
      owner:users!remediation_plans_owner_id_fkey(id, full_name, email)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  } else if (!filters.includeCompleted) {
    query = query.not('status', 'in', '("completed","cancelled")');
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.framework && filters.framework !== 'all') {
    query = query.eq('framework', filters.framework);
  }

  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId);
  }

  if (filters.ownerId) {
    query = query.eq('owner_id', filters.ownerId);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,plan_ref.ilike.%${filters.search}%`);
  }

  // Order and paginate
  query = query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching remediation plans:', error);
    return { plans: [], total: 0 };
  }

  return {
    plans: (data || []) as RemediationPlanWithRelations[],
    total: count || 0,
  };
}

export async function getRemediationPlanById(
  planId: string
): Promise<RemediationPlanWithRelations | null> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('remediation_plans')
    .select(`
      *,
      vendor:vendors(id, name),
      owner:users!remediation_plans_owner_id_fkey(id, full_name, email),
      approver:users!remediation_plans_approver_id_fkey(id, full_name, email)
    `)
    .eq('id', planId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching remediation plan:', error);
    return null;
  }

  return data as RemediationPlanWithRelations;
}

// ============================================================================
// Action Queries
// ============================================================================

export interface ActionFilters {
  planId?: string;
  status?: ActionStatus | 'all';
  priority?: Priority | 'all';
  assigneeId?: string;
  dueWithinDays?: number;
  overdue?: boolean;
}

export async function getRemediationActions(
  filters: ActionFilters = {},
  page: number = 1,
  pageSize: number = 50
): Promise<{ actions: RemediationActionWithRelations[]; total: number }> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { actions: [], total: 0 };
  }

  let query = supabase
    .from('remediation_actions')
    .select(`
      *,
      plan:remediation_plans!inner(id, plan_ref, title, status, priority),
      assignee:users!remediation_actions_assignee_id_fkey(id, full_name, email)
    `, { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters.planId) {
    query = query.eq('plan_id', filters.planId);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.assigneeId) {
    query = query.eq('assignee_id', filters.assigneeId);
  }

  if (filters.dueWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
    query = query.lte('due_date', futureDate.toISOString().split('T')[0]);
  }

  if (filters.overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('due_date', today).not('status', 'in', '("completed","cancelled")');
  }

  // Order and paginate
  query = query
    .order('sort_order', { ascending: true })
    .order('priority', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching remediation actions:', error);
    return { actions: [], total: 0 };
  }

  return {
    actions: (data || []) as RemediationActionWithRelations[],
    total: count || 0,
  };
}

export async function getActionsByPlan(
  planId: string,
  includeEvidence: boolean = false
): Promise<RemediationActionWithRelations[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  // Fetch actions with basic relations
  const { data: actionsData, error: actionsError } = await supabase
    .from('remediation_actions')
    .select(`
      *,
      assignee:users!remediation_actions_assignee_id_fkey(id, full_name, email),
      reviewer:users!remediation_actions_reviewer_id_fkey(id, full_name, email)
    `)
    .eq('plan_id', planId)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true });

  if (actionsError) {
    console.error('Error fetching actions by plan:', actionsError);
    return [];
  }

  const actions = (actionsData || []) as RemediationActionWithRelations[];

  // Optionally fetch evidence for each action
  if (includeEvidence && actions.length > 0) {
    const actionIds = actions.map(a => a.id);
    const { data: evidenceData, error: evidenceError } = await supabase
      .from('remediation_evidence')
      .select('*')
      .in('action_id', actionIds)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (!evidenceError && evidenceData) {
      // Group evidence by action_id
      const evidenceByAction = evidenceData.reduce((acc: Record<string, typeof evidenceData>, ev) => {
        if (!acc[ev.action_id]) {
          acc[ev.action_id] = [];
        }
        acc[ev.action_id].push(ev);
        return acc;
      }, {});

      // Attach evidence to actions
      actions.forEach(action => {
        action.evidence = evidenceByAction[action.id] || [];
      });
    }
  }

  return actions;
}

// ============================================================================
// Evidence Queries
// ============================================================================

export async function getEvidenceByAction(
  actionId: string
): Promise<import('./types').RemediationEvidence[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('remediation_evidence')
    .select('*')
    .eq('action_id', actionId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Kanban View
// ============================================================================

export async function getKanbanData(planId?: string): Promise<KanbanData> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  const emptyKanban: KanbanData = {
    columns: [
      { id: 'backlog', title: 'Backlog', actions: [] },
      { id: 'todo', title: 'To Do', actions: [] },
      { id: 'in_progress', title: 'In Progress', actions: [] },
      { id: 'in_review', title: 'In Review', actions: [] },
      { id: 'completed', title: 'Completed', actions: [] },
    ],
    blockedActions: [],
  };

  if (!organizationId) {
    return emptyKanban;
  }

  let query = supabase
    .from('remediation_actions')
    .select(`
      *,
      plan:remediation_plans!inner(id, plan_ref, title, priority),
      assignee:users!remediation_actions_assignee_id_fkey(id, full_name, email)
    `)
    .eq('organization_id', organizationId)
    .not('status', 'eq', 'cancelled');

  if (planId) {
    query = query.eq('plan_id', planId);
  }

  query = query.order('sort_order', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching kanban data:', error);
    return emptyKanban;
  }

  const actions = (data || []) as RemediationActionWithRelations[];

  // Group by status
  const kanban: KanbanData = {
    columns: [
      { id: 'backlog', title: 'Backlog', actions: actions.filter(a => a.status === 'backlog') },
      { id: 'todo', title: 'To Do', actions: actions.filter(a => a.status === 'todo') },
      { id: 'in_progress', title: 'In Progress', actions: actions.filter(a => a.status === 'in_progress') },
      { id: 'in_review', title: 'In Review', actions: actions.filter(a => a.status === 'in_review') },
      { id: 'completed', title: 'Completed', actions: actions.filter(a => a.status === 'completed') },
    ],
    blockedActions: actions.filter(a => a.status === 'blocked'),
  };

  return kanban;
}

// ============================================================================
// Stats
// ============================================================================

export async function getRemediationStats(): Promise<RemediationStats> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  const emptyStats: RemediationStats = {
    totalPlans: 0,
    activePlans: 0,
    completedPlans: 0,
    overduePlans: 0,
    totalActions: 0,
    completedActions: 0,
    overdueActions: 0,
    blockedActions: 0,
    avgProgress: 0,
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    byStatus: {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    },
    byFramework: {},
  };

  if (!organizationId) {
    return emptyStats;
  }

  const today = new Date().toISOString().split('T')[0];

  // Get plans
  const { data: plans } = await supabase
    .from('remediation_plans')
    .select('id, status, priority, framework, progress_percentage, target_date')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  // Get actions
  const { data: actions } = await supabase
    .from('remediation_actions')
    .select('id, status, due_date')
    .eq('organization_id', organizationId);

  if (!plans || !actions) {
    return emptyStats;
  }

  const activePlans = plans.filter(p =>
    ['approved', 'in_progress'].includes(p.status)
  );

  const stats: RemediationStats = {
    totalPlans: plans.length,
    activePlans: activePlans.length,
    completedPlans: plans.filter(p => p.status === 'completed').length,
    overduePlans: plans.filter(p =>
      p.target_date && p.target_date < today && !['completed', 'cancelled'].includes(p.status)
    ).length,
    totalActions: actions.length,
    completedActions: actions.filter(a => a.status === 'completed').length,
    overdueActions: actions.filter(a =>
      a.due_date && a.due_date < today && !['completed', 'cancelled'].includes(a.status)
    ).length,
    blockedActions: actions.filter(a => a.status === 'blocked').length,
    avgProgress: activePlans.length > 0
      ? activePlans.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / activePlans.length
      : 0,
    byPriority: {
      low: plans.filter(p => p.priority === 'low').length,
      medium: plans.filter(p => p.priority === 'medium').length,
      high: plans.filter(p => p.priority === 'high').length,
      critical: plans.filter(p => p.priority === 'critical').length,
    },
    byStatus: {
      draft: plans.filter(p => p.status === 'draft').length,
      pending_approval: plans.filter(p => p.status === 'pending_approval').length,
      approved: plans.filter(p => p.status === 'approved').length,
      in_progress: plans.filter(p => p.status === 'in_progress').length,
      on_hold: plans.filter(p => p.status === 'on_hold').length,
      completed: plans.filter(p => p.status === 'completed').length,
      cancelled: plans.filter(p => p.status === 'cancelled').length,
    },
    byFramework: {},
  };

  // Count by framework
  plans.forEach(p => {
    const fw = p.framework || 'general';
    stats.byFramework[fw] = (stats.byFramework[fw] || 0) + 1;
  });

  return stats;
}

// ============================================================================
// My Actions (for current user)
// ============================================================================

export async function getMyActions(userId: string): Promise<RemediationActionWithRelations[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('remediation_actions')
    .select(`
      *,
      plan:remediation_plans!inner(id, plan_ref, title, priority, status)
    `)
    .eq('organization_id', organizationId)
    .eq('assignee_id', userId)
    .not('status', 'in', '("completed","cancelled")')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching my actions:', error);
    return [];
  }

  return (data || []) as RemediationActionWithRelations[];
}

// ============================================================================
// Organization Members (for assignment dropdowns)
// ============================================================================

export interface OrganizationMember {
  id: string;
  full_name: string;
  email: string;
}

export async function getOrganizationMembers(): Promise<OrganizationMember[]> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return [];
  }

  // Get users who are members of this organization
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      users!inner(id, full_name, email)
    `)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching organization members:', error);
    return [];
  }

  // Transform the nested data
  return (data || []).map((m: any) => ({
    id: m.user_id,
    full_name: m.users?.full_name || 'Unknown User',
    email: m.users?.email || '',
  }));
}
