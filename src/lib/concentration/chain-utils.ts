/**
 * Fourth-Party Chain Traversal Utilities
 *
 * Functions for traversing and analyzing vendor → subcontractor chains
 * per DORA Article 28(8) requirements for subcontracting visibility.
 */

import { createClient } from '@/lib/supabase/server';
import type { DependencyGraph, DependencyNode, DependencyEdge, RiskLevel } from './types';

/**
 * Subcontractor record from database
 */
export interface Subcontractor {
  id: string;
  vendor_id: string;
  service_id: string | null;
  organization_id: string;
  subcontractor_name: string;
  subcontractor_lei: string | null;
  country_code: string | null;
  tier_level: number;
  parent_subcontractor_id: string | null;
  service_description: string | null;
  service_type: string | null;
  supports_critical_function: boolean;
  is_monitored: boolean;
  last_assessment_date: string | null;
  risk_rating: 'low' | 'medium' | 'high' | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor with subcontractors
 */
export interface VendorWithChain {
  id: string;
  name: string;
  tier: string;
  service_types: string[];
  risk_score: number | null;
  subcontractors: Subcontractor[];
}

/**
 * Chain metrics for a vendor's supply chain
 */
export interface ChainMetrics {
  totalNodes: number;
  maxDepth: number;
  criticalNodes: number;
  unmonitoredNodes: number;
  highRiskNodes: number;
  avgDepth: number;
  hasDeepChain: boolean; // depth > 3
  hasCriticalDeep: boolean; // critical function at depth > 2
}

/**
 * Aggregate chain metrics across all vendors
 */
export interface AggregateChainMetrics {
  avgChainLength: number;
  maxChainDepth: number;
  deepestVendorId: string | null;
  deepestVendorName: string | null;
  totalFourthParties: number;
  totalSubcontractors: number;
  unmonitoredCount: number;
  criticalAtDepth: number;
  vendorsWithChains: number;
}

/**
 * Get all subcontractors for a vendor using recursive CTE
 */
export async function getSubcontractorChain(
  vendorId: string
): Promise<Subcontractor[]> {
  const supabase = await createClient();

  // Use recursive CTE to get full chain (returns JSON)
  const { data, error } = await supabase.rpc('get_subcontractor_chain_json', {
    p_vendor_id: vendorId,
  });

  if (error) {
    // If RPC doesn't exist, fall back to simple query
    if (error.code === '42883') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('tier_level', { ascending: true });

      if (fallbackError) throw fallbackError;
      return (fallbackData || []) as Subcontractor[];
    }
    throw error;
  }

  // Parse JSON result
  return (data || []) as Subcontractor[];
}

/**
 * Build a dependency graph for a single vendor
 */
export async function buildVendorChain(
  vendorId: string
): Promise<{ vendor: VendorWithChain; graph: DependencyGraph; metrics: ChainMetrics }> {
  const supabase = await createClient();

  // Get vendor details
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name, tier, service_types, risk_score')
    .eq('id', vendorId)
    .single();

  if (vendorError) throw vendorError;
  if (!vendor) throw new Error('Vendor not found');

  // Get subcontractor chain
  const subcontractors = await getSubcontractorChain(vendorId);

  // Build graph
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];

  // Add vendor as root node
  nodes.push({
    id: vendor.id,
    name: vendor.name,
    type: 'third_party',
    tier: vendor.tier as 'critical' | 'important' | 'standard',
    risk_score: vendor.risk_score,
    services: vendor.service_types || [],
  });

  // Add subcontractors as nodes and edges
  for (const sub of subcontractors) {
    const nodeType = sub.tier_level === 1 ? 'fourth_party' : 'fourth_party';

    nodes.push({
      id: sub.id,
      name: sub.subcontractor_name,
      type: nodeType,
      tier: sub.supports_critical_function ? 'critical' : 'standard',
      risk_score: sub.risk_rating === 'high' ? 75 : sub.risk_rating === 'medium' ? 50 : 25,
      services: sub.service_type ? [sub.service_type] : [],
    });

    // Edge from parent (vendor or parent subcontractor)
    const sourceId = sub.parent_subcontractor_id || vendor.id;
    edges.push({
      source: sourceId,
      target: sub.id,
      service: sub.service_description || sub.service_type || 'Unknown service',
      criticality: sub.supports_critical_function ? 'critical' : 'standard',
    });
  }

  // Calculate metrics
  const metrics = calculateChainMetrics(subcontractors);

  return {
    vendor: { ...vendor, subcontractors },
    graph: { nodes, edges },
    metrics,
  };
}

/**
 * Calculate metrics for a subcontractor chain
 */
export function calculateChainMetrics(subcontractors: Subcontractor[]): ChainMetrics {
  if (subcontractors.length === 0) {
    return {
      totalNodes: 0,
      maxDepth: 0,
      criticalNodes: 0,
      unmonitoredNodes: 0,
      highRiskNodes: 0,
      avgDepth: 0,
      hasDeepChain: false,
      hasCriticalDeep: false,
    };
  }

  const depths = subcontractors.map((s) => s.tier_level);
  const maxDepth = Math.max(...depths);
  const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;

  const criticalNodes = subcontractors.filter((s) => s.supports_critical_function).length;
  const unmonitoredNodes = subcontractors.filter((s) => !s.is_monitored).length;
  const highRiskNodes = subcontractors.filter((s) => s.risk_rating === 'high').length;

  // Check for critical functions at deep levels
  const hasCriticalDeep = subcontractors.some(
    (s) => s.supports_critical_function && s.tier_level > 2
  );

  return {
    totalNodes: subcontractors.length,
    maxDepth,
    criticalNodes,
    unmonitoredNodes,
    highRiskNodes,
    avgDepth: Math.round(avgDepth * 100) / 100,
    hasDeepChain: maxDepth > 3,
    hasCriticalDeep,
  };
}

/**
 * Build complete supply chain graph for all vendors
 */
export async function buildFullSupplyChainGraph(): Promise<{
  graph: DependencyGraph;
  metrics: AggregateChainMetrics;
  vendorMetrics: Map<string, ChainMetrics>;
}> {
  const supabase = await createClient();

  // Get all active vendors
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('id, name, tier, service_types, risk_score')
    .eq('status', 'active');

  if (vendorsError) throw vendorsError;

  // Get all subcontractors
  const { data: allSubcontractors, error: subsError } = await supabase
    .from('subcontractors')
    .select('*')
    .order('tier_level', { ascending: true });

  if (subsError) throw subsError;

  // Pre-index subcontractors by vendor_id for O(1) lookup instead of O(n) filter
  const subcontractorsByVendor = new Map<string, typeof allSubcontractors>();
  for (const sub of allSubcontractors || []) {
    const existing = subcontractorsByVendor.get(sub.vendor_id) || [];
    existing.push(sub);
    subcontractorsByVendor.set(sub.vendor_id, existing);
  }

  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const vendorMetrics = new Map<string, ChainMetrics>();

  // Add entity node (your organization) at center
  nodes.push({
    id: 'entity',
    name: 'Your Organization',
    type: 'entity',
    tier: 'critical',
    risk_score: null,
    services: [],
  });

  // Process each vendor
  let maxChainDepth = 0;
  let deepestVendorId: string | null = null;
  let deepestVendorName: string | null = null;
  let totalFourthParties = 0;
  let criticalAtDepth = 0;
  let vendorsWithChains = 0;
  let unmonitoredCount = 0;

  for (const vendor of vendors || []) {
    // Add vendor node
    nodes.push({
      id: vendor.id,
      name: vendor.name,
      type: 'third_party',
      tier: vendor.tier as 'critical' | 'important' | 'standard',
      risk_score: vendor.risk_score,
      services: vendor.service_types || [],
    });

    // Edge from entity to vendor
    edges.push({
      source: 'entity',
      target: vendor.id,
      service: 'Direct Contract',
      criticality: vendor.tier === 'critical' ? 'critical' : 'standard',
    });

    // Get this vendor's subcontractors (O(1) lookup from pre-indexed Map)
    const vendorSubs = subcontractorsByVendor.get(vendor.id) || [];

    if (vendorSubs.length > 0) {
      vendorsWithChains++;
      totalFourthParties += vendorSubs.length;

      // Calculate metrics for this vendor
      const metrics = calculateChainMetrics(vendorSubs);
      vendorMetrics.set(vendor.id, metrics);

      // Track deepest chain
      if (metrics.maxDepth > maxChainDepth) {
        maxChainDepth = metrics.maxDepth;
        deepestVendorId = vendor.id;
        deepestVendorName = vendor.name;
      }

      // Track critical at depth
      if (metrics.hasCriticalDeep) {
        criticalAtDepth++;
      }

      unmonitoredCount += metrics.unmonitoredNodes;

      // Add subcontractor nodes and edges
      for (const sub of vendorSubs) {
        nodes.push({
          id: sub.id,
          name: sub.subcontractor_name,
          type: 'fourth_party',
          tier: sub.supports_critical_function ? 'critical' : 'standard',
          risk_score: sub.risk_rating === 'high' ? 75 : sub.risk_rating === 'medium' ? 50 : 25,
          services: sub.service_type ? [sub.service_type] : [],
        });

        // Edge from parent
        const sourceId = sub.parent_subcontractor_id || vendor.id;
        edges.push({
          source: sourceId,
          target: sub.id,
          service: sub.service_description || sub.service_type || 'Service',
          criticality: sub.supports_critical_function ? 'critical' : 'standard',
        });
      }
    }
  }

  // Calculate average chain length
  let totalDepth = 0;
  let chainCount = 0;
  vendorMetrics.forEach((metrics) => {
    if (metrics.totalNodes > 0) {
      totalDepth += metrics.avgDepth;
      chainCount++;
    }
  });

  const avgChainLength = chainCount > 0 ? Math.round((totalDepth / chainCount) * 100) / 100 : 0;

  return {
    graph: { nodes, edges },
    metrics: {
      avgChainLength,
      maxChainDepth,
      deepestVendorId,
      deepestVendorName,
      totalFourthParties,
      totalSubcontractors: allSubcontractors?.length || 0,
      unmonitoredCount,
      criticalAtDepth,
      vendorsWithChains,
    },
    vendorMetrics,
  };
}

/**
 * Get risk level from chain metrics
 */
export function getChainRiskLevel(metrics: ChainMetrics): RiskLevel {
  if (metrics.hasCriticalDeep || metrics.highRiskNodes > 2) {
    return 'critical';
  }
  if (metrics.hasDeepChain || metrics.unmonitoredNodes > 3) {
    return 'high';
  }
  if (metrics.unmonitoredNodes > 0 || metrics.maxDepth > 2) {
    return 'medium';
  }
  return 'low';
}

/**
 * Get chain depth warning message
 */
export function getChainDepthWarning(depth: number): string | null {
  if (depth >= 5) {
    return 'Critical: Extended supply chain requires immediate review';
  }
  if (depth >= 3) {
    return 'Warning: Deep supply chain detected - enhanced monitoring recommended';
  }
  return null;
}

/**
 * Format tier level for display
 */
export function formatTierLevel(level: number): string {
  switch (level) {
    case 1:
      return 'Direct Subcontractor';
    case 2:
      return 'Fourth Party';
    case 3:
      return 'Fifth Party';
    case 4:
      return 'Sixth Party';
    default:
      return `${level + 2}th Party`;
  }
}
