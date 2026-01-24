/**
 * Multi-Domain Risk Assessment Queries
 *
 * Database query functions for risk domains and vendor assessments
 */

import { createClient } from '@/lib/supabase/server';
import type {
  RiskDomain,
  RiskDomainWithCriteria,
  DomainAssessmentCriterion,
  VendorDomainAssessment,
  VendorDomainAssessmentWithDetails,
  VendorRiskProfile,
  DomainAssessmentStats,
  VendorAssessmentSummary,
  AssessmentHistoryEntry,
  RiskLevel,
} from './types';

// ============================================
// Risk Domain Queries
// ============================================

/**
 * Get all active risk domains for an organization
 * Includes both system defaults and custom domains
 */
export async function getRiskDomains(
  organizationId: string
): Promise<RiskDomain[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('risk_domains')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching risk domains:', error);
    throw new Error('Failed to fetch risk domains');
  }

  return data || [];
}

/**
 * Get a single risk domain by ID
 */
export async function getRiskDomain(
  domainId: string
): Promise<RiskDomain | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('risk_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching risk domain:', error);
    throw new Error('Failed to fetch risk domain');
  }

  return data;
}

/**
 * Get risk domains with their assessment criteria
 */
export async function getRiskDomainsWithCriteria(
  organizationId: string
): Promise<RiskDomainWithCriteria[]> {
  const supabase = await createClient();

  // Get domains
  const { data: domains, error: domainError } = await supabase
    .from('risk_domains')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (domainError) {
    console.error('Error fetching risk domains:', domainError);
    throw new Error('Failed to fetch risk domains');
  }

  if (!domains || domains.length === 0) {
    return [];
  }

  // Get criteria for all domains
  const domainIds = domains.map((d) => d.id);
  const { data: criteria, error: criteriaError } = await supabase
    .from('domain_assessment_criteria')
    .select('*')
    .in('domain_id', domainIds)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (criteriaError) {
    console.error('Error fetching criteria:', criteriaError);
    throw new Error('Failed to fetch assessment criteria');
  }

  // Combine domains with their criteria
  return domains.map((domain) => ({
    ...domain,
    criteria: (criteria || []).filter((c) => c.domain_id === domain.id),
  }));
}

/**
 * Get assessment criteria for a specific domain
 */
export async function getDomainCriteria(
  domainId: string
): Promise<DomainAssessmentCriterion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('domain_assessment_criteria')
    .select('*')
    .eq('domain_id', domainId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching domain criteria:', error);
    throw new Error('Failed to fetch domain criteria');
  }

  return data || [];
}

// ============================================
// Vendor Assessment Queries
// ============================================

/**
 * Get all domain assessments for a vendor
 */
export async function getVendorAssessments(
  vendorId: string
): Promise<VendorDomainAssessmentWithDetails[]> {
  const supabase = await createClient();

  // Get assessments
  const { data: assessments, error: assessmentError } = await supabase
    .from('vendor_domain_assessments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (assessmentError) {
    console.error('Error fetching vendor assessments:', assessmentError);
    throw new Error('Failed to fetch vendor assessments');
  }

  if (!assessments || assessments.length === 0) {
    return [];
  }

  // Get domain details
  const domainIds = [...new Set(assessments.map((a) => a.domain_id))];
  const { data: domains } = await supabase
    .from('risk_domains')
    .select('*')
    .in('id', domainIds);

  const domainMap = new Map((domains || []).map((d) => [d.id, d]));

  // Get scores for all assessments
  const assessmentIds = assessments.map((a) => a.id);
  const { data: scores } = await supabase
    .from('vendor_domain_scores')
    .select('*')
    .in('assessment_id', assessmentIds);

  // Get criteria for scores
  const criterionIds = [...new Set((scores || []).map((s) => s.criterion_id))];
  const { data: criteria } = await supabase
    .from('domain_assessment_criteria')
    .select('*')
    .in('id', criterionIds);

  const criterionMap = new Map((criteria || []).map((c) => [c.id, c]));

  // Get assessor names
  const assessorIds = [
    ...new Set(assessments.map((a) => a.assessed_by).filter(Boolean)),
  ];
  let assessorMap: Record<string, string> = {};
  if (assessorIds.length > 0) {
    const { data: assessors } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', assessorIds);

    if (assessors) {
      assessorMap = Object.fromEntries(
        assessors.map((a) => [a.id, a.full_name])
      );
    }
  }

  // Build detailed assessments
  return assessments.map((assessment) => ({
    ...assessment,
    domain: domainMap.get(assessment.domain_id)!,
    scores: (scores || [])
      .filter((s) => s.assessment_id === assessment.id)
      .map((s) => ({
        ...s,
        criterion: criterionMap.get(s.criterion_id)!,
      })),
    assessed_by_user: assessment.assessed_by
      ? { full_name: assessorMap[assessment.assessed_by] || 'Unknown' }
      : null,
  }));
}

/**
 * Get a single assessment by ID
 */
export async function getAssessment(
  assessmentId: string
): Promise<VendorDomainAssessmentWithDetails | null> {
  const supabase = await createClient();

  const { data: assessment, error } = await supabase
    .from('vendor_domain_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching assessment:', error);
    throw new Error('Failed to fetch assessment');
  }

  // Get domain
  const { data: domain } = await supabase
    .from('risk_domains')
    .select('*')
    .eq('id', assessment.domain_id)
    .single();

  // Get scores with criteria
  const { data: scores } = await supabase
    .from('vendor_domain_scores')
    .select('*')
    .eq('assessment_id', assessmentId);

  const criterionIds = (scores || []).map((s) => s.criterion_id);
  const { data: criteria } = await supabase
    .from('domain_assessment_criteria')
    .select('*')
    .in('id', criterionIds);

  const criterionMap = new Map((criteria || []).map((c) => [c.id, c]));

  // Get assessor name
  let assessorName: string | null = null;
  if (assessment.assessed_by) {
    const { data: assessor } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', assessment.assessed_by)
      .single();
    assessorName = assessor?.full_name || null;
  }

  return {
    ...assessment,
    domain: domain!,
    scores: (scores || []).map((s) => ({
      ...s,
      criterion: criterionMap.get(s.criterion_id)!,
    })),
    assessed_by_user: assessorName ? { full_name: assessorName } : null,
  };
}

/**
 * Get vendor's latest assessment for a specific domain
 */
export async function getVendorDomainAssessment(
  vendorId: string,
  domainId: string
): Promise<VendorDomainAssessment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendor_domain_assessments')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('domain_id', domainId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching vendor domain assessment:', error);
    throw new Error('Failed to fetch vendor domain assessment');
  }

  return data;
}

/**
 * Get complete risk profile for a vendor
 */
export async function getVendorRiskProfile(
  vendorId: string
): Promise<VendorRiskProfile | null> {
  const supabase = await createClient();

  // Get vendor info
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name, organization_id')
    .eq('id', vendorId)
    .single();

  if (vendorError) {
    if (vendorError.code === 'PGRST116') return null;
    throw new Error('Failed to fetch vendor');
  }

  // Get all domains
  const domains = await getRiskDomains(vendor.organization_id);

  // Get all assessments for this vendor
  const assessments = await getVendorAssessments(vendorId);

  // Calculate overall score (weighted average)
  const completedAssessments = assessments.filter(
    (a) => a.status === 'completed' && a.score !== null
  );

  let overallScore: number | null = null;
  let overallRiskLevel: RiskLevel | null = null;

  if (completedAssessments.length > 0) {
    const totalWeight = completedAssessments.reduce((sum, a) => {
      const domain = domains.find((d) => d.id === a.domain_id);
      return sum + (domain?.weight || 1);
    }, 0);

    const weightedSum = completedAssessments.reduce((sum, a) => {
      const domain = domains.find((d) => d.id === a.domain_id);
      return sum + (a.score || 0) * (domain?.weight || 1);
    }, 0);

    overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;
    overallRiskLevel = calculateRiskLevel(overallScore);
  }

  // Get last assessed date
  const lastAssessed = completedAssessments.reduce<string | null>(
    (latest, a) => {
      if (!a.assessed_at) return latest;
      if (!latest) return a.assessed_at;
      return a.assessed_at > latest ? a.assessed_at : latest;
    },
    null
  );

  return {
    vendor_id: vendorId,
    vendor_name: vendor.name,
    overall_score: overallScore,
    overall_risk_level: overallRiskLevel,
    assessments,
    last_assessed_at: lastAssessed,
    domains_assessed: completedAssessments.length,
    domains_total: domains.length,
  };
}

// ============================================
// Assessment History Queries
// ============================================

/**
 * Get assessment history for a vendor domain
 */
export async function getAssessmentHistory(
  vendorId: string,
  domainId?: string
): Promise<AssessmentHistoryEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from('vendor_domain_assessment_history')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('assessed_at', { ascending: false });

  if (domainId) {
    query = query.eq('domain_id', domainId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assessment history:', error);
    throw new Error('Failed to fetch assessment history');
  }

  return data || [];
}

// ============================================
// Statistics Queries
// ============================================

/**
 * Get assessment statistics for a domain across all vendors
 */
export async function getDomainStats(
  organizationId: string,
  domainId: string
): Promise<DomainAssessmentStats> {
  const supabase = await createClient();

  // Get total vendors
  const { count: totalVendors } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  // Get assessments for this domain
  const { data: assessments } = await supabase
    .from('vendor_domain_assessments')
    .select(
      `
      id,
      status,
      score,
      risk_level,
      next_assessment_date,
      vendor_id,
      vendors!inner(organization_id)
    `
    )
    .eq('domain_id', domainId)
    .eq('vendors.organization_id', organizationId);

  const completed = (assessments || []).filter(
    (a) => a.status === 'completed'
  );
  const pending = (assessments || []).filter(
    (a) => a.status === 'pending' || a.status === 'in_progress'
  );

  // Calculate overdue
  const now = new Date().toISOString();
  const overdue = completed.filter(
    (a) => a.next_assessment_date && a.next_assessment_date < now
  );

  // Calculate average score
  const scores = completed
    .map((a) => a.score)
    .filter((s): s is number => s !== null);
  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
        10
      : null;

  // Risk distribution
  const riskDistribution = {
    low: completed.filter((a) => a.risk_level === 'low').length,
    medium: completed.filter((a) => a.risk_level === 'medium').length,
    high: completed.filter((a) => a.risk_level === 'high').length,
    critical: completed.filter((a) => a.risk_level === 'critical').length,
  };

  return {
    total_vendors: totalVendors || 0,
    assessed_vendors: completed.length,
    pending_assessments: pending.length,
    overdue_assessments: overdue.length,
    average_score: averageScore,
    risk_distribution: riskDistribution,
  };
}

/**
 * Get assessment summaries for all vendors in an organization
 */
export async function getVendorAssessmentSummaries(
  organizationId: string
): Promise<VendorAssessmentSummary[]> {
  const supabase = await createClient();

  // Get all vendors
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('organization_id', organizationId)
    .order('name');

  if (vendorError) {
    console.error('Error fetching vendors:', vendorError);
    throw new Error('Failed to fetch vendors');
  }

  if (!vendors || vendors.length === 0) {
    return [];
  }

  // Get all domains
  const domains = await getRiskDomains(organizationId);

  // Get all assessments for these vendors
  const vendorIds = vendors.map((v) => v.id);
  const { data: assessments } = await supabase
    .from('vendor_domain_assessments')
    .select('*')
    .in('vendor_id', vendorIds);

  // Build summaries
  return vendors.map((vendor) => {
    const vendorAssessments = (assessments || []).filter(
      (a) => a.vendor_id === vendor.id
    );

    const domainSummaries = domains.map((domain) => {
      const assessment = vendorAssessments.find(
        (a) => a.domain_id === domain.id
      );
      return {
        domain_id: domain.id,
        domain_name: domain.name,
        score: assessment?.score || null,
        risk_level: assessment?.risk_level || null,
        status: assessment?.status || ('pending' as const),
        last_assessed: assessment?.assessed_at || null,
      };
    });

    // Calculate overall score
    const completedDomains = domainSummaries.filter(
      (d) => d.status === 'completed' && d.score !== null
    );

    let overallScore: number | null = null;
    let overallRisk: RiskLevel | null = null;

    if (completedDomains.length > 0) {
      const totalWeight = completedDomains.reduce((sum, d) => {
        const domain = domains.find((dom) => dom.id === d.domain_id);
        return sum + (domain?.weight || 1);
      }, 0);

      const weightedSum = completedDomains.reduce((sum, d) => {
        const domain = domains.find((dom) => dom.id === d.domain_id);
        return sum + (d.score || 0) * (domain?.weight || 1);
      }, 0);

      overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;
      overallRisk = calculateRiskLevel(overallScore);
    }

    return {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      domains: domainSummaries,
      overall_score: overallScore,
      overall_risk: overallRisk,
    };
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate risk level from score (0-100)
 */
function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}
