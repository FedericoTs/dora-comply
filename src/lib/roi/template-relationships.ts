/**
 * Template Relationships
 *
 * Defines relationships between RoI templates for visualization
 */

import type { RoiTemplateId } from './types';

export interface TemplateRelationship {
  source: RoiTemplateId;
  target: RoiTemplateId;
  type: 'requires' | 'feeds' | 'references';
  description: string;
}

export interface TemplateNode {
  id: RoiTemplateId;
  name: string;
  shortName: string;
  group: 'entity' | 'contracts' | 'links' | 'providers' | 'functions' | 'exit';
  tier: 1 | 2 | 3; // 1 = core, 2 = dependent, 3 = extension
  x?: number;
  y?: number;
}

// Template definitions with positions for layout
export const TEMPLATE_NODES: TemplateNode[] = [
  // Tier 1 - Core entity information
  { id: 'B_01.01', name: 'Entity Maintaining Register', shortName: 'Entity', group: 'entity', tier: 1 },
  { id: 'B_01.02', name: 'Entities in Scope', shortName: 'Scope', group: 'entity', tier: 1 },
  { id: 'B_01.03', name: 'Branches', shortName: 'Branches', group: 'entity', tier: 2 },

  // Tier 1 - ICT Providers
  { id: 'B_02.01', name: 'ICT Third-Party Providers', shortName: 'Providers', group: 'providers', tier: 1 },
  { id: 'B_02.02', name: 'Provider Branches/Subsidiaries', shortName: 'Provider Branches', group: 'providers', tier: 2 },
  { id: 'B_02.03', name: 'Ultimate Parent Undertaking', shortName: 'Parent', group: 'providers', tier: 2 },

  // Tier 2 - Contractual Arrangements
  { id: 'B_03.01', name: 'Contractual Arrangements', shortName: 'Contracts', group: 'contracts', tier: 1 },
  { id: 'B_03.02', name: 'Arrangement Details', shortName: 'Details', group: 'contracts', tier: 2 },
  { id: 'B_03.03', name: 'Contracted ICT Services', shortName: 'Services', group: 'contracts', tier: 2 },

  // Tier 2 - ICT Services
  { id: 'B_04.01', name: 'ICT Services Type', shortName: 'Service Types', group: 'links', tier: 2 },

  // Tier 3 - Functions
  { id: 'B_05.01', name: 'Functions Identification', shortName: 'Functions', group: 'functions', tier: 1 },
  { id: 'B_05.02', name: 'Function-ICT Service Links', shortName: 'Service Links', group: 'functions', tier: 2 },

  // Tier 3 - Assessments & Exit
  { id: 'B_06.01', name: 'Risk Assessment', shortName: 'Risk', group: 'exit', tier: 2 },
  { id: 'B_07.01', name: 'Exit Strategy', shortName: 'Exit Plan', group: 'exit', tier: 3 },
];

// Define relationships between templates
export const TEMPLATE_RELATIONSHIPS: TemplateRelationship[] = [
  // Entity relationships
  { source: 'B_01.01', target: 'B_01.02', type: 'feeds', description: 'Entity defines scope' },
  { source: 'B_01.02', target: 'B_01.03', type: 'references', description: 'Scope includes branches' },

  // Provider relationships
  { source: 'B_02.01', target: 'B_02.02', type: 'feeds', description: 'Providers have branches' },
  { source: 'B_02.01', target: 'B_02.03', type: 'references', description: 'Providers have parent' },

  // Contract flow
  { source: 'B_01.02', target: 'B_03.01', type: 'requires', description: 'Entity required for contracts' },
  { source: 'B_02.01', target: 'B_03.01', type: 'requires', description: 'Provider required for contracts' },
  { source: 'B_03.01', target: 'B_03.02', type: 'feeds', description: 'Contract details' },
  { source: 'B_03.01', target: 'B_03.03', type: 'feeds', description: 'Contract services' },

  // Service types
  { source: 'B_03.03', target: 'B_04.01', type: 'feeds', description: 'Services define types' },

  // Functions flow
  { source: 'B_01.02', target: 'B_05.01', type: 'requires', description: 'Entity required for functions' },
  { source: 'B_05.01', target: 'B_05.02', type: 'feeds', description: 'Functions link to services' },
  { source: 'B_04.01', target: 'B_05.02', type: 'requires', description: 'Services link to functions' },

  // Assessment and exit
  { source: 'B_03.01', target: 'B_06.01', type: 'feeds', description: 'Contracts need assessment' },
  { source: 'B_05.01', target: 'B_06.01', type: 'references', description: 'Functions inform risk' },
  { source: 'B_06.01', target: 'B_07.01', type: 'feeds', description: 'Risk informs exit strategy' },
];

// Group colors for visualization
export const GROUP_COLORS: Record<TemplateNode['group'], string> = {
  entity: '#3B82F6', // Blue
  providers: '#10B981', // Green
  contracts: '#F59E0B', // Amber
  links: '#8B5CF6', // Purple
  functions: '#EC4899', // Pink
  exit: '#EF4444', // Red
};

// Calculate positions for diagram layout
export function calculateNodePositions(nodes: TemplateNode[]): Map<RoiTemplateId, { x: number; y: number }> {
  const positions = new Map<RoiTemplateId, { x: number; y: number }>();

  // Group nodes by tier
  const tier1 = nodes.filter(n => n.tier === 1);
  const tier2 = nodes.filter(n => n.tier === 2);
  const tier3 = nodes.filter(n => n.tier === 3);

  // Layout parameters
  const width = 800;
  const height = 600;
  const tierWidth = width / 3;

  // Position tier 1 (left column)
  tier1.forEach((node, index) => {
    positions.set(node.id, {
      x: tierWidth * 0.5,
      y: (height / (tier1.length + 1)) * (index + 1),
    });
  });

  // Position tier 2 (middle column)
  tier2.forEach((node, index) => {
    positions.set(node.id, {
      x: tierWidth * 1.5,
      y: (height / (tier2.length + 1)) * (index + 1),
    });
  });

  // Position tier 3 (right column)
  tier3.forEach((node, index) => {
    positions.set(node.id, {
      x: tierWidth * 2.5,
      y: (height / (tier3.length + 1)) * (index + 1),
    });
  });

  return positions;
}

// Get templates that need attention before a specific template
export function getPrerequisites(templateId: RoiTemplateId): RoiTemplateId[] {
  const prerequisites: RoiTemplateId[] = [];

  TEMPLATE_RELATIONSHIPS.forEach(rel => {
    if (rel.target === templateId && rel.type === 'requires') {
      prerequisites.push(rel.source);
      // Recursively get prerequisites
      prerequisites.push(...getPrerequisites(rel.source));
    }
  });

  return [...new Set(prerequisites)];
}

// Get templates that depend on a specific template
export function getDependents(templateId: RoiTemplateId): RoiTemplateId[] {
  const dependents: RoiTemplateId[] = [];

  TEMPLATE_RELATIONSHIPS.forEach(rel => {
    if (rel.source === templateId) {
      dependents.push(rel.target);
    }
  });

  return dependents;
}

// Get completion order for optimal workflow
export function getCompletionOrder(): RoiTemplateId[] {
  // Topological sort based on dependencies
  const visited = new Set<RoiTemplateId>();
  const order: RoiTemplateId[] = [];

  function visit(nodeId: RoiTemplateId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Visit prerequisites first
    getPrerequisites(nodeId).forEach(visit);

    order.push(nodeId);
  }

  TEMPLATE_NODES.forEach(node => visit(node.id));

  return order;
}

// Get relationship type label
export function getRelationshipLabel(type: TemplateRelationship['type']): string {
  switch (type) {
    case 'requires':
      return 'Required by';
    case 'feeds':
      return 'Feeds into';
    case 'references':
      return 'References';
  }
}
