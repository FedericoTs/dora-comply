'use server';

/**
 * Multi-Domain Risk Assessment Server Actions
 *
 * Server actions for managing risk domains and vendor assessments
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CreateDomainInput,
  UpdateDomainInput,
  CreateCriterionInput,
  UpdateCriterionInput,
  StartAssessmentInput,
  SubmitAssessmentInput,
  UpdateAssessmentInput,
  RiskLevel,
  MaturityLevel,
} from './types';

// ============================================
// Risk Domain Actions
// ============================================

/**
 * Create a custom risk domain for an organization
 */
export async function createRiskDomain(
  organizationId: string,
  input: CreateDomainInput
): Promise<{ success: boolean; domainId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get next order_index
    const { data: existingDomains } = await supabase
      .from('risk_domains')
      .select('order_index')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = (existingDomains?.[0]?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('risk_domains')
      .insert({
        organization_id: organizationId,
        name: input.name,
        description: input.description || null,
        icon: input.icon || 'Shield',
        color: input.color || '#6B7280',
        weight: input.weight,
        is_system: false,
        order_index: nextIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating risk domain:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/vendors');
    revalidatePath('/settings/risk-domains');

    return { success: true, domainId: data.id };
  } catch (error) {
    console.error('Error creating risk domain:', error);
    return { success: false, error: 'Failed to create risk domain' };
  }
}

/**
 * Update a risk domain
 */
export async function updateRiskDomain(
  domainId: string,
  input: UpdateDomainInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('risk_domains')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    if (error) {
      console.error('Error updating risk domain:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/vendors');
    revalidatePath('/settings/risk-domains');

    return { success: true };
  } catch (error) {
    console.error('Error updating risk domain:', error);
    return { success: false, error: 'Failed to update risk domain' };
  }
}

/**
 * Delete a custom risk domain
 */
export async function deleteRiskDomain(
  domainId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if it's a system domain
    const { data: domain } = await supabase
      .from('risk_domains')
      .select('is_system')
      .eq('id', domainId)
      .single();

    if (domain?.is_system) {
      return { success: false, error: 'Cannot delete system domains' };
    }

    const { error } = await supabase
      .from('risk_domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      console.error('Error deleting risk domain:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/vendors');
    revalidatePath('/settings/risk-domains');

    return { success: true };
  } catch (error) {
    console.error('Error deleting risk domain:', error);
    return { success: false, error: 'Failed to delete risk domain' };
  }
}

// ============================================
// Assessment Criteria Actions
// ============================================

/**
 * Create a new assessment criterion for a domain
 */
export async function createCriterion(
  input: CreateCriterionInput
): Promise<{ success: boolean; criterionId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get next order_index
    const { data: existingCriteria } = await supabase
      .from('domain_assessment_criteria')
      .select('order_index')
      .eq('domain_id', input.domain_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = (existingCriteria?.[0]?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('domain_assessment_criteria')
      .insert({
        domain_id: input.domain_id,
        name: input.name,
        description: input.description || null,
        guidance: input.guidance || null,
        weight: input.weight,
        max_score: input.max_score || 100,
        order_index: nextIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating criterion:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/risk-domains');

    return { success: true, criterionId: data.id };
  } catch (error) {
    console.error('Error creating criterion:', error);
    return { success: false, error: 'Failed to create criterion' };
  }
}

/**
 * Update an assessment criterion
 */
export async function updateCriterion(
  criterionId: string,
  input: UpdateCriterionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('domain_assessment_criteria')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', criterionId);

    if (error) {
      console.error('Error updating criterion:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/risk-domains');

    return { success: true };
  } catch (error) {
    console.error('Error updating criterion:', error);
    return { success: false, error: 'Failed to update criterion' };
  }
}

/**
 * Delete an assessment criterion
 */
export async function deleteCriterion(
  criterionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('domain_assessment_criteria')
      .delete()
      .eq('id', criterionId);

    if (error) {
      console.error('Error deleting criterion:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings/risk-domains');

    return { success: true };
  } catch (error) {
    console.error('Error deleting criterion:', error);
    return { success: false, error: 'Failed to delete criterion' };
  }
}

// ============================================
// Vendor Assessment Actions
// ============================================

/**
 * Start a new assessment for a vendor domain
 */
export async function startAssessment(
  input: StartAssessmentInput,
  userId: string
): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if there's already an in-progress assessment
    const { data: existing } = await supabase
      .from('vendor_domain_assessments')
      .select('id, status')
      .eq('vendor_id', input.vendor_id)
      .eq('domain_id', input.domain_id)
      .in('status', ['pending', 'in_progress'])
      .single();

    if (existing) {
      return { success: true, assessmentId: existing.id };
    }

    const { data, error } = await supabase
      .from('vendor_domain_assessments')
      .insert({
        vendor_id: input.vendor_id,
        domain_id: input.domain_id,
        status: 'in_progress',
        assessed_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting assessment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${input.vendor_id}`);

    return { success: true, assessmentId: data.id };
  } catch (error) {
    console.error('Error starting assessment:', error);
    return { success: false, error: 'Failed to start assessment' };
  }
}

/**
 * Submit a completed assessment with scores
 */
export async function submitAssessment(
  input: SubmitAssessmentInput,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get assessment to verify it exists
    const { data: assessment, error: fetchError } = await supabase
      .from('vendor_domain_assessments')
      .select('id, vendor_id, domain_id')
      .eq('id', input.assessment_id)
      .single();

    if (fetchError || !assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    // Get criteria for this domain to calculate weighted score
    const { data: criteria } = await supabase
      .from('domain_assessment_criteria')
      .select('id, weight, max_score')
      .eq('domain_id', assessment.domain_id)
      .eq('is_active', true);

    // Calculate overall score
    let totalWeight = 0;
    let weightedSum = 0;

    for (const score of input.scores) {
      const criterion = criteria?.find((c) => c.id === score.criterion_id);
      if (criterion) {
        const normalizedScore = (score.score / criterion.max_score) * 100;
        weightedSum += normalizedScore * criterion.weight;
        totalWeight += criterion.weight;
      }
    }

    const overallScore = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10) / 10
      : 0;

    // Determine risk level and maturity
    const riskLevel = calculateRiskLevel(overallScore);
    const maturityLevel = calculateMaturityLevel(overallScore);

    // Start transaction-like operations
    // 1. Delete existing scores
    await supabase
      .from('vendor_domain_scores')
      .delete()
      .eq('assessment_id', input.assessment_id);

    // 2. Insert new scores
    const scoresToInsert = input.scores.map((s) => ({
      assessment_id: input.assessment_id,
      criterion_id: s.criterion_id,
      score: s.score,
      notes: s.notes || null,
      evidence_document_ids: s.evidence_document_ids || [],
    }));

    const { error: scoresError } = await supabase
      .from('vendor_domain_scores')
      .insert(scoresToInsert);

    if (scoresError) {
      console.error('Error inserting scores:', scoresError);
      return { success: false, error: 'Failed to save scores' };
    }

    // 3. Update assessment
    const { error: updateError } = await supabase
      .from('vendor_domain_assessments')
      .update({
        score: overallScore,
        risk_level: riskLevel,
        maturity_level: maturityLevel,
        status: 'completed',
        assessed_by: userId,
        assessed_at: new Date().toISOString(),
        notes: input.notes || null,
        key_findings: input.key_findings || [],
        recommendations: input.recommendations || [],
        next_assessment_date: input.next_assessment_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.assessment_id);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return { success: false, error: 'Failed to update assessment' };
    }

    // 4. Create history entry
    const scoresSnapshot: Record<string, number> = {};
    input.scores.forEach((s) => {
      scoresSnapshot[s.criterion_id] = s.score;
    });

    await supabase.from('vendor_domain_assessment_history').insert({
      vendor_id: assessment.vendor_id,
      domain_id: assessment.domain_id,
      score: overallScore,
      maturity_level: maturityLevel,
      risk_level: riskLevel,
      assessed_by: userId,
      assessed_at: new Date().toISOString(),
      scores_snapshot: scoresSnapshot,
    });

    revalidatePath(`/vendors/${assessment.vendor_id}`);
    revalidatePath('/vendors');

    return { success: true };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return { success: false, error: 'Failed to submit assessment' };
  }
}

/**
 * Update assessment metadata (notes, findings, etc.)
 */
export async function updateAssessment(
  assessmentId: string,
  input: UpdateAssessmentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: assessment, error: fetchError } = await supabase
      .from('vendor_domain_assessments')
      .select('vendor_id')
      .eq('id', assessmentId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Assessment not found' };
    }

    const { error } = await supabase
      .from('vendor_domain_assessments')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId);

    if (error) {
      console.error('Error updating assessment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${assessment.vendor_id}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating assessment:', error);
    return { success: false, error: 'Failed to update assessment' };
  }
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(
  assessmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: assessment, error: fetchError } = await supabase
      .from('vendor_domain_assessments')
      .select('vendor_id')
      .eq('id', assessmentId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Assessment not found' };
    }

    // Scores will cascade delete
    const { error } = await supabase
      .from('vendor_domain_assessments')
      .delete()
      .eq('id', assessmentId);

    if (error) {
      console.error('Error deleting assessment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${assessment.vendor_id}`);
    revalidatePath('/vendors');

    return { success: true };
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return { success: false, error: 'Failed to delete assessment' };
  }
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Initialize assessments for all domains for a vendor
 */
export async function initializeVendorAssessments(
  vendorId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; assessmentIds?: string[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Get all active domains
    const { data: domains } = await supabase
      .from('risk_domains')
      .select('id')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .eq('is_active', true);

    if (!domains || domains.length === 0) {
      return { success: false, error: 'No risk domains found' };
    }

    // Check for existing assessments
    const { data: existing } = await supabase
      .from('vendor_domain_assessments')
      .select('domain_id')
      .eq('vendor_id', vendorId);

    const existingDomainIds = new Set((existing || []).map((e) => e.domain_id));

    // Create assessments for domains that don't have one
    const toCreate = domains
      .filter((d) => !existingDomainIds.has(d.id))
      .map((d) => ({
        vendor_id: vendorId,
        domain_id: d.id,
        status: 'pending' as const,
        assessed_by: userId,
      }));

    if (toCreate.length === 0) {
      return { success: true, assessmentIds: [] };
    }

    const { data, error } = await supabase
      .from('vendor_domain_assessments')
      .insert(toCreate)
      .select('id');

    if (error) {
      console.error('Error initializing assessments:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${vendorId}`);

    return { success: true, assessmentIds: data.map((d) => d.id) };
  } catch (error) {
    console.error('Error initializing assessments:', error);
    return { success: false, error: 'Failed to initialize assessments' };
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

function calculateMaturityLevel(score: number): MaturityLevel {
  if (score >= 90) return 'L4';
  if (score >= 70) return 'L3';
  if (score >= 50) return 'L2';
  if (score >= 30) return 'L1';
  return 'L0';
}
