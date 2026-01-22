/**
 * NIS2 Compliance Queries
 *
 * Server-side database queries for NIS2 compliance data.
 */

import { createClient } from '@/lib/supabase/server';
import type { NIS2RequirementAssessment } from './nis2-calculator';
import type { NIS2ComplianceStatus, NIS2EntityType } from './nis2-types';

// =============================================================================
// Types
// =============================================================================

interface NIS2AssessmentRow {
  id: string;
  organization_id: string;
  requirement_id: string;
  status: NIS2ComplianceStatus;
  evidence_count: number;
  gaps: string[];
  notes: string | null;
  assessed_at: string;
  assessed_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get all NIS2 assessments for the current organization
 */
export async function getNIS2Assessments(): Promise<{
  assessments: NIS2RequirementAssessment[];
  entityType: NIS2EntityType;
  organizationId: string;
} | null> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) return null;

  const organizationId = userData.organization_id;

  // Get organization to determine entity type
  const { data: orgData } = await supabase
    .from('organizations')
    .select('entity_type, is_significant')
    .eq('id', organizationId)
    .single();

  // Default to essential entity for financial entities
  const entityType: NIS2EntityType = orgData?.is_significant
    ? 'essential_entity'
    : 'important_entity';

  // Sync assessments from vendor data (auto-populates if not already populated)
  // This uses a database function that preserves manual assessments
  await supabase.rpc('sync_nis2_assessments', { p_organization_id: organizationId });

  // Fetch assessments from nis2_assessments table
  const { data: assessments, error } = await supabase
    .from('nis2_assessments')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching NIS2 assessments:', error.message);
    return {
      assessments: [],
      entityType,
      organizationId,
    };
  }

  const rows = (assessments || []) as unknown as NIS2AssessmentRow[];

  return {
    assessments: rows.map(row => ({
      requirementId: row.requirement_id,
      status: row.status,
      evidenceCount: row.evidence_count,
      gaps: row.gaps || [],
      notes: row.notes || undefined,
      assessedAt: row.assessed_at,
      assessedBy: row.assessed_by || undefined,
    })),
    entityType,
    organizationId,
  };
}

/**
 * Save a NIS2 assessment
 */
export async function saveNIS2Assessment(
  requirementId: string,
  assessment: Omit<NIS2RequirementAssessment, 'requirementId'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: 'No organization found' };
  }

  const { error } = await supabase
    .from('nis2_assessments')
    .upsert({
      organization_id: userData.organization_id,
      requirement_id: requirementId,
      status: assessment.status,
      evidence_count: assessment.evidenceCount,
      gaps: assessment.gaps,
      notes: assessment.notes || null,
      assessed_at: new Date().toISOString(),
      assessed_by: user.id,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'organization_id,requirement_id',
    });

  if (error) {
    console.error('Error saving NIS2 assessment:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get NIS2 compliance summary stats
 */
export async function getNIS2SummaryStats(): Promise<{
  totalAssessed: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  notAssessed: number;
  lastAssessedAt: string | null;
} | null> {
  const result = await getNIS2Assessments();
  if (!result) return null;

  const { assessments } = result;
  const compliant = assessments.filter(a => a.status === 'compliant').length;
  const partial = assessments.filter(a => a.status === 'partial').length;
  const nonCompliant = assessments.filter(a => a.status === 'non_compliant').length;
  const totalAssessed = compliant + partial + nonCompliant;

  // Get latest assessment date
  const sortedByDate = assessments
    .filter(a => a.assessedAt)
    .sort((a, b) => new Date(b.assessedAt!).getTime() - new Date(a.assessedAt!).getTime());

  return {
    totalAssessed,
    compliant,
    partial,
    nonCompliant,
    notAssessed: 42 - totalAssessed, // 42 NIS2 requirements
    lastAssessedAt: sortedByDate[0]?.assessedAt || null,
  };
}
