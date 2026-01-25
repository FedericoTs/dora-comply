/**
 * ESG Module Queries
 *
 * Database query functions for ESG categories, metrics, and assessments
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ESGCategory,
  ESGMetric,
  ESGCategoryWithMetrics,
  VendorESGAssessment,
  VendorESGAssessmentWithDetails,
  VendorESGCertification,
  VendorESGCommitment,
  VendorESGHistory,
  VendorESGProfile,
  ESGStats,
  ESGRiskLevel,
} from './types';

// ============================================
// Category and Metric Queries
// ============================================

/**
 * Get all ESG categories
 */
export async function getESGCategories(): Promise<ESGCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('esg_categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching ESG categories:', error);
    throw new Error('Failed to fetch ESG categories');
  }

  return data || [];
}

/**
 * Get ESG categories with their metrics
 */
export async function getESGCategoriesWithMetrics(): Promise<ESGCategoryWithMetrics[]> {
  const supabase = await createClient();

  // Get categories
  const { data: categories, error: catError } = await supabase
    .from('esg_categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (catError) {
    console.error('Error fetching ESG categories:', catError);
    throw new Error('Failed to fetch ESG categories');
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  // Get metrics for all categories
  const categoryIds = categories.map((c) => c.id);
  const { data: metrics, error: metricError } = await supabase
    .from('esg_metrics')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (metricError) {
    console.error('Error fetching ESG metrics:', metricError);
    throw new Error('Failed to fetch ESG metrics');
  }

  // Combine categories with their metrics
  return categories.map((category) => ({
    ...category,
    metrics: (metrics || []).filter((m) => m.category_id === category.id),
  }));
}

/**
 * Get metrics for a specific category
 */
export async function getESGMetrics(categoryId: string): Promise<ESGMetric[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('esg_metrics')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching ESG metrics:', error);
    throw new Error('Failed to fetch ESG metrics');
  }

  return data || [];
}

// ============================================
// Assessment Queries
// ============================================

/**
 * Get vendor's latest ESG assessment
 */
export async function getVendorLatestESGAssessment(
  vendorId: string
): Promise<VendorESGAssessmentWithDetails | null> {
  const supabase = await createClient();

  // Get latest assessment
  const { data: assessment, error } = await supabase
    .from('vendor_esg_assessments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('assessment_year', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching ESG assessment:', error);
    throw new Error('Failed to fetch ESG assessment');
  }

  // Get metric values
  const { data: metricValues } = await supabase
    .from('vendor_esg_metric_values')
    .select('*')
    .eq('assessment_id', assessment.id);

  // Get metrics for the values
  const metricIds = (metricValues || []).map((v) => v.metric_id);
  const { data: metrics } = await supabase
    .from('esg_metrics')
    .select('*')
    .in('id', metricIds);

  const metricMap = new Map((metrics || []).map((m) => [m.id, m]));

  // Get user names
  let assessorName: string | null = null;
  let verifierName: string | null = null;

  if (assessment.assessed_by) {
    const { data: assessor } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', assessment.assessed_by)
      .single();
    assessorName = assessor?.full_name || null;
  }

  if (assessment.verified_by) {
    const { data: verifier } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', assessment.verified_by)
      .single();
    verifierName = verifier?.full_name || null;
  }

  return {
    ...assessment,
    metric_values: (metricValues || []).map((v) => ({
      ...v,
      metric: metricMap.get(v.metric_id)!,
    })),
    assessed_by_user: assessorName ? { full_name: assessorName } : null,
    verified_by_user: verifierName ? { full_name: verifierName } : null,
  };
}

/**
 * Get all ESG assessments for a vendor
 */
export async function getVendorESGAssessments(
  vendorId: string
): Promise<VendorESGAssessment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_esg_assessments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('assessment_year', { ascending: false });

  if (error) {
    console.error('Error fetching ESG assessments:', error);
    throw new Error('Failed to fetch ESG assessments');
  }

  return data || [];
}

/**
 * Get a specific assessment by ID
 */
export async function getESGAssessment(
  assessmentId: string
): Promise<VendorESGAssessmentWithDetails | null> {
  const supabase = await createClient();

  const { data: assessment, error } = await supabase
    .from('vendor_esg_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching ESG assessment:', error);
    throw new Error('Failed to fetch ESG assessment');
  }

  // Get metric values
  const { data: metricValues } = await supabase
    .from('vendor_esg_metric_values')
    .select('*')
    .eq('assessment_id', assessment.id);

  // Get metrics
  const metricIds = (metricValues || []).map((v) => v.metric_id);
  const { data: metrics } = await supabase
    .from('esg_metrics')
    .select('*')
    .in('id', metricIds.length > 0 ? metricIds : ['placeholder']);

  const metricMap = new Map((metrics || []).map((m) => [m.id, m]));

  return {
    ...assessment,
    metric_values: (metricValues || []).map((v) => ({
      ...v,
      metric: metricMap.get(v.metric_id)!,
    })),
  };
}

// ============================================
// Certification Queries
// ============================================

/**
 * Get all certifications for a vendor
 */
export async function getVendorESGCertifications(
  vendorId: string
): Promise<VendorESGCertification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_esg_certifications')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('issue_date', { ascending: false });

  if (error) {
    console.error('Error fetching ESG certifications:', error);
    throw new Error('Failed to fetch ESG certifications');
  }

  return data || [];
}

// ============================================
// Commitment Queries
// ============================================

/**
 * Get all commitments for a vendor
 */
export async function getVendorESGCommitments(
  vendorId: string
): Promise<VendorESGCommitment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_esg_commitments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('target_date', { ascending: true });

  if (error) {
    console.error('Error fetching ESG commitments:', error);
    throw new Error('Failed to fetch ESG commitments');
  }

  return data || [];
}

// ============================================
// History Queries
// ============================================

/**
 * Get ESG assessment history for a vendor
 */
export async function getVendorESGHistory(
  vendorId: string,
  limit?: number
): Promise<VendorESGHistory[]> {
  const supabase = await createClient();

  let query = supabase
    .from('vendor_esg_history')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('assessment_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching ESG history:', error);
    throw new Error('Failed to fetch ESG history');
  }

  return data || [];
}

// ============================================
// Profile Queries
// ============================================

/**
 * Get complete ESG profile for a vendor
 */
export async function getVendorESGProfile(
  vendorId: string
): Promise<VendorESGProfile | null> {
  const supabase = await createClient();

  // Get vendor name
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('id', vendorId)
    .single();

  if (vendorError) {
    if (vendorError.code === 'PGRST116') return null;
    throw new Error('Failed to fetch vendor');
  }

  // Fetch all data in parallel
  const [latestAssessment, certifications, commitments, history] =
    await Promise.all([
      getVendorLatestESGAssessment(vendorId),
      getVendorESGCertifications(vendorId),
      getVendorESGCommitments(vendorId),
      getVendorESGHistory(vendorId, 12), // Last 12 records for trend
    ]);

  return {
    vendor_id: vendorId,
    vendor_name: vendor.name,
    latest_assessment: latestAssessment,
    certifications,
    commitments,
    history,
  };
}

// ============================================
// Stats Queries
// ============================================

/**
 * Get ESG statistics for an organization
 */
export async function getESGStats(organizationId: string): Promise<ESGStats> {
  const supabase = await createClient();

  // Get total vendors
  const { count: totalVendors } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  // Get latest assessments for each vendor
  const { data: assessments } = await supabase
    .from('vendor_esg_assessments')
    .select(
      `
      id,
      vendor_id,
      overall_score,
      environmental_score,
      social_score,
      governance_score,
      esg_risk_level,
      status,
      vendors!inner(organization_id)
    `
    )
    .eq('status', 'completed')
    .eq('vendors.organization_id', organizationId);

  // Deduplicate to get only latest per vendor
  type AssessmentData = NonNullable<typeof assessments>[number];
  const vendorAssessmentMap = new Map<string, AssessmentData>();
  (assessments || []).forEach((a) => {
    if (!vendorAssessmentMap.has(a.vendor_id)) {
      vendorAssessmentMap.set(a.vendor_id, a);
    }
  });

  const latestAssessments = Array.from(vendorAssessmentMap.values());

  // Calculate averages
  const scores = latestAssessments
    .map((a) => a.overall_score)
    .filter((s): s is number => s !== null);

  const envScores = latestAssessments
    .map((a) => a.environmental_score)
    .filter((s): s is number => s !== null);

  const socialScores = latestAssessments
    .map((a) => a.social_score)
    .filter((s): s is number => s !== null);

  const govScores = latestAssessments
    .map((a) => a.governance_score)
    .filter((s): s is number => s !== null);

  const avg = (arr: number[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : null;

  // Risk distribution
  const riskDistribution = {
    low: latestAssessments.filter((a) => a.esg_risk_level === 'low').length,
    medium: latestAssessments.filter((a) => a.esg_risk_level === 'medium').length,
    high: latestAssessments.filter((a) => a.esg_risk_level === 'high').length,
    critical: latestAssessments.filter((a) => a.esg_risk_level === 'critical').length,
  };

  return {
    total_vendors: totalVendors || 0,
    assessed_vendors: latestAssessments.length,
    average_score: avg(scores),
    average_environmental: avg(envScores),
    average_social: avg(socialScores),
    average_governance: avg(govScores),
    risk_distribution: riskDistribution,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate ESG risk level from score
 */
export function calculateESGRiskLevel(score: number): ESGRiskLevel {
  if (score >= 75) return 'low';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'high';
  return 'critical';
}
