/**
 * NIS2 Risk Management Queries
 *
 * Server-side data fetching functions for risks and controls.
 * Designed for use in Server Components.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import type {
  NIS2Risk,
  NIS2Control,
  NIS2RiskControl,
  NIS2RiskAssessment,
  RiskSummary,
} from './types';
import type { RiskFilters, ControlFilters } from './schema';
import {
  calculateFullRiskAssessment,
  type ControlForCalculation,
} from './risk-calculator';

// ============================================================================
// Types
// ============================================================================

interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

interface ListQueryResult<T> {
  data: T[];
  total: number;
  error: string | null;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

// ============================================================================
// Risk Queries
// ============================================================================

/**
 * Get all risks for the organization
 */
export async function getRisks(
  filters: RiskFilters = {},
  pagination: PaginationOptions = {}
): Promise<ListQueryResult<NIS2Risk>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: [], total: 0, error: 'No organization found' };
  }

  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('nis2_risks')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.inherent_level) {
    query = query.eq('inherent_risk_level', filters.inherent_level);
  }
  if (filters.residual_level) {
    query = query.eq('residual_risk_level', filters.residual_level);
  }
  if (filters.treatment_strategy) {
    query = query.eq('treatment_strategy', filters.treatment_strategy);
  }
  if (filters.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,reference_code.ilike.%${filters.search}%`);
  }

  // Apply pagination and ordering
  query = query
    .order('inherent_risk_score', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching risks:', error);
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data as NIS2Risk[]) || [],
    total: count || 0,
    error: null,
  };
}

/**
 * Get a single risk by ID with linked controls
 */
export async function getRiskById(riskId: string): Promise<QueryResult<NIS2Risk & { controls: NIS2RiskControl[] }>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Get risk
  const { data: risk, error: riskError } = await supabase
    .from('nis2_risks')
    .select('*')
    .eq('id', riskId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (riskError) {
    return { data: null, error: riskError.message };
  }

  // Get linked controls
  const { data: riskControls, error: controlsError } = await supabase
    .from('nis2_risk_controls')
    .select(`
      *,
      control:nis2_controls(*)
    `)
    .eq('risk_id', riskId);

  if (controlsError) {
    console.error('Error fetching risk controls:', controlsError);
  }

  return {
    data: {
      ...(risk as NIS2Risk),
      controls: (riskControls as NIS2RiskControl[]) || [],
    },
    error: null,
  };
}

/**
 * Create a new risk
 */
export async function createRisk(
  input: Omit<NIS2Risk, 'id' | 'organization_id' | 'reference_code' | 'inherent_risk_score' | 'inherent_risk_level' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<QueryResult<NIS2Risk>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Generate reference code
  const { data: codeData } = await supabase
    .rpc('generate_nis2_risk_code', { org_id: organizationId });

  const referenceCode = codeData || `NIS2-RISK-${Date.now()}`;

  const { data, error } = await supabase
    .from('nis2_risks')
    .insert({
      ...input,
      organization_id: organizationId,
      reference_code: referenceCode,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating risk:', error);
    return { data: null, error: error.message };
  }

  return { data: data as NIS2Risk, error: null };
}

/**
 * Update a risk
 */
export async function updateRisk(
  riskId: string,
  input: Partial<NIS2Risk>
): Promise<QueryResult<NIS2Risk>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Remove fields that shouldn't be updated directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructuring to exclude fields
  const { id, organization_id, reference_code, inherent_risk_score, inherent_risk_level, created_at, updated_at, deleted_at, ...updateData } = input;

  const { data, error } = await supabase
    .from('nis2_risks')
    .update(updateData)
    .eq('id', riskId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating risk:', error);
    return { data: null, error: error.message };
  }

  return { data: data as NIS2Risk, error: null };
}

/**
 * Soft delete a risk
 */
export async function deleteRisk(riskId: string): Promise<QueryResult<boolean>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  const { error } = await supabase
    .from('nis2_risks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', riskId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting risk:', error);
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================================================
// Control Queries
// ============================================================================

/**
 * Get all controls for the organization
 */
export async function getControls(
  filters: ControlFilters = {},
  pagination: PaginationOptions = {}
): Promise<ListQueryResult<NIS2Control>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: [], total: 0, error: 'No organization found' };
  }

  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('nis2_controls')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.control_type) {
    query = query.eq('control_type', filters.control_type);
  }
  if (filters.implementation_status) {
    query = query.eq('implementation_status', filters.implementation_status);
  }
  if (filters.min_effectiveness !== undefined) {
    query = query.gte('overall_effectiveness', filters.min_effectiveness);
  }
  if (filters.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,reference_code.ilike.%${filters.search}%`);
  }

  // Apply pagination and ordering
  query = query
    .order('overall_effectiveness', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching controls:', error);
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data as NIS2Control[]) || [],
    total: count || 0,
    error: null,
  };
}

/**
 * Get a single control by ID
 */
export async function getControlById(controlId: string): Promise<QueryResult<NIS2Control>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  const { data, error } = await supabase
    .from('nis2_controls')
    .select('*')
    .eq('id', controlId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as NIS2Control, error: null };
}

/**
 * Create a new control
 */
export async function createControl(
  input: Omit<NIS2Control, 'id' | 'organization_id' | 'reference_code' | 'overall_effectiveness' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<QueryResult<NIS2Control>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Generate reference code
  const { data: codeData } = await supabase
    .rpc('generate_nis2_control_code', {
      org_id: organizationId,
      ctrl_type: input.control_type,
    });

  const referenceCode = codeData || `CTRL-${Date.now()}`;

  const { data, error } = await supabase
    .from('nis2_controls')
    .insert({
      ...input,
      organization_id: organizationId,
      reference_code: referenceCode,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating control:', error);
    return { data: null, error: error.message };
  }

  return { data: data as NIS2Control, error: null };
}

/**
 * Update a control
 */
export async function updateControl(
  controlId: string,
  input: Partial<NIS2Control>
): Promise<QueryResult<NIS2Control>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Remove fields that shouldn't be updated directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructuring to exclude fields
  const { id, organization_id, reference_code, overall_effectiveness, created_at, updated_at, deleted_at, ...updateData } = input;

  const { data, error } = await supabase
    .from('nis2_controls')
    .update(updateData)
    .eq('id', controlId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating control:', error);
    return { data: null, error: error.message };
  }

  return { data: data as NIS2Control, error: null };
}

/**
 * Soft delete a control
 */
export async function deleteControl(controlId: string): Promise<QueryResult<boolean>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  const { error } = await supabase
    .from('nis2_controls')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', controlId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting control:', error);
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================================================
// Risk-Control Linkage
// ============================================================================

/**
 * Link a control to a risk
 */
export async function linkControlToRisk(
  riskId: string,
  controlId: string,
  effectivenessScore: number,
  rationale?: string
): Promise<QueryResult<NIS2RiskControl>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_risk_controls')
    .insert({
      risk_id: riskId,
      control_id: controlId,
      effectiveness_score: effectivenessScore,
      effectiveness_rationale: rationale,
    })
    .select()
    .single();

  if (error) {
    console.error('Error linking control:', error);
    return { data: null, error: error.message };
  }

  // Recalculate residual risk
  await recalculateResidualRisk(riskId);

  return { data: data as NIS2RiskControl, error: null };
}

/**
 * Update control effectiveness for a risk
 */
export async function updateControlEffectiveness(
  linkId: string,
  effectivenessScore: number,
  rationale?: string
): Promise<QueryResult<NIS2RiskControl>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_risk_controls')
    .update({
      effectiveness_score: effectivenessScore,
      effectiveness_rationale: rationale,
    })
    .eq('id', linkId)
    .select()
    .single();

  if (error) {
    console.error('Error updating control effectiveness:', error);
    return { data: null, error: error.message };
  }

  // Get risk_id and recalculate
  if (data) {
    await recalculateResidualRisk((data as NIS2RiskControl).risk_id);
  }

  return { data: data as NIS2RiskControl, error: null };
}

/**
 * Unlink a control from a risk
 */
export async function unlinkControlFromRisk(linkId: string): Promise<QueryResult<boolean>> {
  const supabase = await createClient();

  // Get risk_id before deleting
  const { data: linkData } = await supabase
    .from('nis2_risk_controls')
    .select('risk_id')
    .eq('id', linkId)
    .single();

  const { error } = await supabase
    .from('nis2_risk_controls')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Error unlinking control:', error);
    return { data: null, error: error.message };
  }

  // Recalculate residual risk
  if (linkData) {
    await recalculateResidualRisk(linkData.risk_id);
  }

  return { data: true, error: null };
}

/**
 * Get controls linked to a risk
 */
export async function getRiskControls(riskId: string): Promise<ListQueryResult<NIS2RiskControl & { control: NIS2Control }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_risk_controls')
    .select(`
      *,
      control:nis2_controls(*)
    `)
    .eq('risk_id', riskId);

  if (error) {
    console.error('Error fetching risk controls:', error);
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data as (NIS2RiskControl & { control: NIS2Control })[]) || [],
    total: data?.length || 0,
    error: null,
  };
}

// ============================================================================
// Residual Risk Calculation
// ============================================================================

/**
 * Recalculate residual risk for a risk
 */
export async function recalculateResidualRisk(riskId: string): Promise<QueryResult<NIS2Risk>> {
  const supabase = await createClient();

  // Get risk
  const { data: risk, error: riskError } = await supabase
    .from('nis2_risks')
    .select('*')
    .eq('id', riskId)
    .single();

  if (riskError || !risk) {
    return { data: null, error: riskError?.message || 'Risk not found' };
  }

  // Get linked controls
  const { data: riskControls } = await supabase
    .from('nis2_risk_controls')
    .select(`
      effectiveness_score,
      control:nis2_controls(control_type)
    `)
    .eq('risk_id', riskId);

  const controls: ControlForCalculation[] = (riskControls || []).map(rc => ({
    id: '',
    effectiveness_score: rc.effectiveness_score,
    control_type: (rc.control as { control_type?: string })?.control_type as 'preventive' | 'detective' | 'corrective' | undefined,
  }));

  // Calculate residual risk
  const result = calculateFullRiskAssessment(
    risk.likelihood_score,
    risk.impact_score,
    controls,
    risk.tolerance_threshold
  );

  // Update risk with residual values
  const { data: updatedRisk, error: updateError } = await supabase
    .from('nis2_risks')
    .update({
      residual_likelihood: result.residual_likelihood,
      residual_impact: result.residual_impact,
      residual_risk_score: result.residual_risk_score,
      residual_risk_level: result.residual_risk_level,
      combined_control_effectiveness: result.combined_control_effectiveness,
      is_within_tolerance: result.is_within_tolerance,
      last_assessed_at: new Date().toISOString(),
      status: controls.length > 0 ? 'assessed' : 'identified',
    })
    .eq('id', riskId)
    .select()
    .single();

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: updatedRisk as NIS2Risk, error: null };
}

// ============================================================================
// Summary and Statistics
// ============================================================================

/**
 * Get risk summary for the organization
 */
export async function getRiskSummary(): Promise<QueryResult<RiskSummary>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  const { data, error } = await supabase
    .from('nis2_org_risk_summary')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    // If no data, return empty summary
    if (error.code === 'PGRST116') {
      return {
        data: {
          total_risks: 0,
          critical_inherent: 0,
          high_inherent: 0,
          medium_inherent: 0,
          low_inherent: 0,
          critical_residual: 0,
          high_residual: 0,
          medium_residual: 0,
          low_residual: 0,
          not_assessed: 0,
          avg_inherent_score: null,
          avg_residual_score: null,
          avg_control_effectiveness: null,
        },
        error: null,
      };
    }
    return { data: null, error: error.message };
  }

  return { data: data as RiskSummary, error: null };
}

/**
 * Get risks for heat map display
 */
export async function getRisksForHeatMap(): Promise<ListQueryResult<NIS2Risk>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: [], total: 0, error: 'No organization found' };
  }

  const { data, error, count } = await supabase
    .from('nis2_risks')
    .select('id, reference_code, title, category, likelihood_score, impact_score, inherent_risk_score, inherent_risk_level, residual_likelihood, residual_impact, residual_risk_score, residual_risk_level, status, tolerance_threshold', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching risks for heat map:', error);
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data as NIS2Risk[]) || [],
    total: count || 0,
    error: null,
  };
}

// ============================================================================
// Assessment History
// ============================================================================

/**
 * Create an assessment record (for history tracking)
 */
export async function createAssessmentRecord(
  riskId: string,
  notes?: string
): Promise<QueryResult<NIS2RiskAssessment>> {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganization();

  if (!organizationId) {
    return { data: null, error: 'No organization found' };
  }

  // Get current risk state
  const { data: risk, error: riskError } = await supabase
    .from('nis2_risks')
    .select('*')
    .eq('id', riskId)
    .single();

  if (riskError || !risk) {
    return { data: null, error: riskError?.message || 'Risk not found' };
  }

  const { data, error } = await supabase
    .from('nis2_risk_assessments')
    .insert({
      risk_id: riskId,
      organization_id: organizationId,
      likelihood_score: risk.likelihood_score,
      impact_score: risk.impact_score,
      inherent_risk_score: risk.inherent_risk_score,
      inherent_risk_level: risk.inherent_risk_level,
      residual_likelihood: risk.residual_likelihood,
      residual_impact: risk.residual_impact,
      residual_risk_score: risk.residual_risk_score,
      residual_risk_level: risk.residual_risk_level,
      combined_control_effectiveness: risk.combined_control_effectiveness,
      treatment_strategy: risk.treatment_strategy,
      assessment_notes: notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating assessment record:', error);
    return { data: null, error: error.message };
  }

  return { data: data as NIS2RiskAssessment, error: null };
}

/**
 * Get assessment history for a risk
 */
export async function getAssessmentHistory(riskId: string): Promise<ListQueryResult<NIS2RiskAssessment>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('nis2_risk_assessments')
    .select('*')
    .eq('risk_id', riskId)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('Error fetching assessment history:', error);
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data as NIS2RiskAssessment[]) || [],
    total: data?.length || 0,
    error: null,
  };
}
