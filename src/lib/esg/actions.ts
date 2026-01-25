'use server';

/**
 * ESG Module Server Actions
 *
 * Server actions for managing ESG assessments, certifications, and commitments
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateESGRiskLevel } from './queries';
import type {
  CreateESGAssessmentInput,
  SubmitESGAssessmentInput,
  CreateCertificationInput,
  CreateCommitmentInput,
  CertificationStatus,
  CommitmentStatus,
} from './types';

// ============================================
// Assessment Actions
// ============================================

/**
 * Create a new ESG assessment for a vendor
 */
export async function createESGAssessment(
  input: CreateESGAssessmentInput,
  userId: string
): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if assessment already exists for this year/period
    const { data: existing } = await supabase
      .from('vendor_esg_assessments')
      .select('id')
      .eq('vendor_id', input.vendor_id)
      .eq('assessment_year', input.assessment_year)
      .eq('assessment_period', input.assessment_period || 'annual')
      .single();

    if (existing) {
      return { success: true, assessmentId: existing.id };
    }

    const { data, error } = await supabase
      .from('vendor_esg_assessments')
      .insert({
        vendor_id: input.vendor_id,
        assessment_year: input.assessment_year,
        assessment_period: input.assessment_period || 'annual',
        status: 'draft',
        assessed_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ESG assessment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${input.vendor_id}`);

    return { success: true, assessmentId: data.id };
  } catch (error) {
    console.error('Error creating ESG assessment:', error);
    return { success: false, error: 'Failed to create ESG assessment' };
  }
}

/**
 * Submit/complete an ESG assessment with metric values
 */
export async function submitESGAssessment(
  input: SubmitESGAssessmentInput,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get assessment to verify it exists
    const { data: assessment, error: fetchError } = await supabase
      .from('vendor_esg_assessments')
      .select('id, vendor_id')
      .eq('id', input.assessment_id)
      .single();

    if (fetchError || !assessment) {
      return { success: false, error: 'Assessment not found' };
    }

    // Get all metrics to calculate scores
    const { data: metrics } = await supabase
      .from('esg_metrics')
      .select('id, category_id, metric_type, target_direction')
      .eq('is_active', true);

    // Get categories
    const { data: categories } = await supabase
      .from('esg_categories')
      .select('id, name, weight')
      .eq('is_active', true);

    // Delete existing metric values
    await supabase
      .from('vendor_esg_metric_values')
      .delete()
      .eq('assessment_id', input.assessment_id);

    // Insert new metric values
    const metricValuesToInsert = input.metric_values.map((mv) => {
      const metric = metrics?.find((m) => m.id === mv.metric_id);
      let score: number | null = null;

      // Calculate score based on metric type
      if (metric) {
        if (metric.metric_type === 'boolean' && mv.boolean_value !== undefined) {
          score = mv.boolean_value ? 100 : 0;
        } else if (metric.metric_type === 'percentage' && mv.numeric_value !== undefined) {
          if (metric.target_direction === 'higher_better') {
            score = Math.min(mv.numeric_value, 100);
          } else if (metric.target_direction === 'lower_better') {
            score = Math.max(100 - mv.numeric_value, 0);
          } else {
            score = mv.numeric_value;
          }
        } else if (metric.metric_type === 'rating' && mv.numeric_value !== undefined) {
          // Assume 1-5 scale, normalize to 0-100
          score = ((mv.numeric_value - 1) / 4) * 100;
        } else if (metric.metric_type === 'numeric' && mv.numeric_value !== undefined) {
          // For numeric, we need context - default to using the value directly if 0-100
          score = Math.min(Math.max(mv.numeric_value, 0), 100);
        }
      }

      return {
        assessment_id: input.assessment_id,
        metric_id: mv.metric_id,
        numeric_value: mv.numeric_value ?? null,
        text_value: mv.text_value ?? null,
        boolean_value: mv.boolean_value ?? null,
        score,
        notes: mv.notes ?? null,
        source_url: mv.source_url ?? null,
        evidence_document_ids: [],
      };
    });

    const { error: valuesError } = await supabase
      .from('vendor_esg_metric_values')
      .insert(metricValuesToInsert);

    if (valuesError) {
      console.error('Error inserting metric values:', valuesError);
      return { success: false, error: 'Failed to save metric values' };
    }

    // Calculate category scores
    const categoryScores: Record<string, { total: number; count: number }> = {};

    metricValuesToInsert.forEach((mv) => {
      if (mv.score === null) return;
      const metric = metrics?.find((m) => m.id === mv.metric_id);
      if (!metric) return;

      if (!categoryScores[metric.category_id]) {
        categoryScores[metric.category_id] = { total: 0, count: 0 };
      }
      categoryScores[metric.category_id].total += mv.score;
      categoryScores[metric.category_id].count += 1;
    });

    // Calculate pillar scores
    let environmentalScore: number | null = null;
    let socialScore: number | null = null;
    let governanceScore: number | null = null;

    categories?.forEach((cat) => {
      const catScore = categoryScores[cat.id];
      if (!catScore || catScore.count === 0) return;

      const avg = Math.round((catScore.total / catScore.count) * 10) / 10;

      if (cat.name === 'Environmental') {
        environmentalScore = avg;
      } else if (cat.name === 'Social') {
        socialScore = avg;
      } else if (cat.name === 'Governance') {
        governanceScore = avg;
      }
    });

    // Calculate overall score (weighted average of pillars)
    const pillarScores = [
      { score: environmentalScore, weight: 33.33 },
      { score: socialScore, weight: 33.33 },
      { score: governanceScore, weight: 33.34 },
    ].filter((p) => p.score !== null);

    let overallScore: number | null = null;
    if (pillarScores.length > 0) {
      const totalWeight = pillarScores.reduce((sum, p) => sum + p.weight, 0);
      const weightedSum = pillarScores.reduce(
        (sum, p) => sum + (p.score || 0) * p.weight,
        0
      );
      overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;
    }

    // Determine risk level
    const riskLevel = overallScore !== null ? calculateESGRiskLevel(overallScore) : null;

    // Update assessment
    const { error: updateError } = await supabase
      .from('vendor_esg_assessments')
      .update({
        overall_score: overallScore,
        environmental_score: environmentalScore,
        social_score: socialScore,
        governance_score: governanceScore,
        esg_risk_level: riskLevel,
        status: 'completed',
        assessed_by: userId,
        assessed_at: new Date().toISOString(),
        notes: input.notes ?? null,
        key_strengths: input.key_strengths ?? [],
        improvement_areas: input.improvement_areas ?? [],
        external_rating_provider: input.external_rating_provider ?? null,
        external_rating: input.external_rating ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.assessment_id);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return { success: false, error: 'Failed to update assessment' };
    }

    revalidatePath(`/vendors/${assessment.vendor_id}`);

    return { success: true };
  } catch (error) {
    console.error('Error submitting ESG assessment:', error);
    return { success: false, error: 'Failed to submit ESG assessment' };
  }
}

/**
 * Delete an ESG assessment
 */
export async function deleteESGAssessment(
  assessmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: assessment } = await supabase
      .from('vendor_esg_assessments')
      .select('vendor_id')
      .eq('id', assessmentId)
      .single();

    // Metric values will cascade delete
    const { error } = await supabase
      .from('vendor_esg_assessments')
      .delete()
      .eq('id', assessmentId);

    if (error) {
      console.error('Error deleting ESG assessment:', error);
      return { success: false, error: error.message };
    }

    if (assessment) {
      revalidatePath(`/vendors/${assessment.vendor_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting ESG assessment:', error);
    return { success: false, error: 'Failed to delete ESG assessment' };
  }
}

// ============================================
// Certification Actions
// ============================================

/**
 * Create a new ESG certification for a vendor
 */
export async function createESGCertification(
  input: CreateCertificationInput
): Promise<{ success: boolean; certificationId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_esg_certifications')
      .insert({
        vendor_id: input.vendor_id,
        certification_name: input.certification_name,
        certification_type: input.certification_type,
        issuing_body: input.issuing_body ?? null,
        issue_date: input.issue_date ?? null,
        expiry_date: input.expiry_date ?? null,
        certificate_url: input.certificate_url ?? null,
        notes: input.notes ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ESG certification:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${input.vendor_id}`);

    return { success: true, certificationId: data.id };
  } catch (error) {
    console.error('Error creating ESG certification:', error);
    return { success: false, error: 'Failed to create ESG certification' };
  }
}

/**
 * Update a certification's status
 */
export async function updateCertificationStatus(
  certificationId: string,
  status: CertificationStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: cert } = await supabase
      .from('vendor_esg_certifications')
      .select('vendor_id')
      .eq('id', certificationId)
      .single();

    const { error } = await supabase
      .from('vendor_esg_certifications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', certificationId);

    if (error) {
      console.error('Error updating certification status:', error);
      return { success: false, error: error.message };
    }

    if (cert) {
      revalidatePath(`/vendors/${cert.vendor_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating certification status:', error);
    return { success: false, error: 'Failed to update certification status' };
  }
}

/**
 * Delete a certification
 */
export async function deleteESGCertification(
  certificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: cert } = await supabase
      .from('vendor_esg_certifications')
      .select('vendor_id')
      .eq('id', certificationId)
      .single();

    const { error } = await supabase
      .from('vendor_esg_certifications')
      .delete()
      .eq('id', certificationId);

    if (error) {
      console.error('Error deleting ESG certification:', error);
      return { success: false, error: error.message };
    }

    if (cert) {
      revalidatePath(`/vendors/${cert.vendor_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting ESG certification:', error);
    return { success: false, error: 'Failed to delete ESG certification' };
  }
}

// ============================================
// Commitment Actions
// ============================================

/**
 * Create a new ESG commitment for a vendor
 */
export async function createESGCommitment(
  input: CreateCommitmentInput
): Promise<{ success: boolean; commitmentId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_esg_commitments')
      .insert({
        vendor_id: input.vendor_id,
        commitment_type: input.commitment_type,
        title: input.title,
        description: input.description ?? null,
        target_date: input.target_date ?? null,
        target_value: input.target_value ?? null,
        current_progress: input.current_progress ?? 0,
        source_url: input.source_url ?? null,
        notes: input.notes ?? null,
        status: 'on_track',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ESG commitment:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/vendors/${input.vendor_id}`);

    return { success: true, commitmentId: data.id };
  } catch (error) {
    console.error('Error creating ESG commitment:', error);
    return { success: false, error: 'Failed to create ESG commitment' };
  }
}

/**
 * Update a commitment's progress and status
 */
export async function updateCommitmentProgress(
  commitmentId: string,
  progress: number,
  status: CommitmentStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: commitment } = await supabase
      .from('vendor_esg_commitments')
      .select('vendor_id')
      .eq('id', commitmentId)
      .single();

    const { error } = await supabase
      .from('vendor_esg_commitments')
      .update({
        current_progress: progress,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commitmentId);

    if (error) {
      console.error('Error updating commitment progress:', error);
      return { success: false, error: error.message };
    }

    if (commitment) {
      revalidatePath(`/vendors/${commitment.vendor_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating commitment progress:', error);
    return { success: false, error: 'Failed to update commitment progress' };
  }
}

/**
 * Delete a commitment
 */
export async function deleteESGCommitment(
  commitmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: commitment } = await supabase
      .from('vendor_esg_commitments')
      .select('vendor_id')
      .eq('id', commitmentId)
      .single();

    const { error } = await supabase
      .from('vendor_esg_commitments')
      .delete()
      .eq('id', commitmentId);

    if (error) {
      console.error('Error deleting ESG commitment:', error);
      return { success: false, error: error.message };
    }

    if (commitment) {
      revalidatePath(`/vendors/${commitment.vendor_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting ESG commitment:', error);
    return { success: false, error: 'Failed to delete ESG commitment' };
  }
}
