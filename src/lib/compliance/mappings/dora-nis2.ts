/**
 * DORA to NIS2 Cross-Framework Mappings
 *
 * High overlap (~75%) between DORA and NIS2:
 * - Both focus on ICT/cyber resilience for critical entities
 * - NIS2 is broader in scope (all critical sectors)
 * - DORA is deeper for financial sector
 *
 * Mapping based on article-level alignment.
 */

import { CrossFrameworkMapping } from '../framework-types';

export const DORA_NIS2_MAPPINGS: CrossFrameworkMapping[] = [
  // ============================================================================
  // ICT Risk Management (DORA Arts. 5-16) → NIS2 Risk Management (Art. 21)
  // ============================================================================
  {
    id: 'dora-nis2-001',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-5',         // ICT Risk Management Framework
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2a',        // Risk Analysis Policies
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require comprehensive ICT/cyber risk management frameworks with similar scope.',
  },
  {
    id: 'dora-nis2-002',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-6',         // ICT Systems & Tools
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2e',        // Security in Systems
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both address security in system acquisition, development, and maintenance.',
  },
  {
    id: 'dora-nis2-003',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-7',         // Identification
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-1',         // All-Hazards Approach
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'DORA identification more detailed; NIS2 all-hazards broader but less ICT-specific.',
  },
  {
    id: 'dora-nis2-004',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-8',         // Protection & Prevention
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2h',        // Cryptography & Encryption
    mapping_type: 'partial',
    coverage_percentage: 60,
    confidence: 0.85,
    bidirectional: false,
    notes: 'DORA protection broader; NIS2 Art.21(2)(h) specifically covers cryptography.',
  },
  {
    id: 'dora-nis2-005',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-8',         // Protection & Prevention
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2j',        // MFA & Secure Communications
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Both require MFA and secure communications; NIS2 more explicit.',
  },
  {
    id: 'dora-nis2-006',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',         // Detection
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-detection', // Detection Capabilities
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require detection capabilities for security events and incidents.',
  },
  {
    id: 'dora-nis2-007',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-10',        // Response & Recovery
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2b',        // Incident Handling
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both mandate incident handling procedures with similar requirements.',
  },
  {
    id: 'dora-nis2-008',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',        // Backup Policies
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-backup',    // Backup Management
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require backup management procedures; nearly identical requirements.',
  },
  {
    id: 'dora-nis2-009',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-12',        // Learning & Evolution
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2f',        // Cybersecurity Measure Assessment
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require continuous improvement of security measures.',
  },
  {
    id: 'dora-nis2-010',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-13',        // Communication Policies
    target_framework: 'nis2',
    target_requirement_id: 'nis2-23-5',         // User/Customer Notification
    mapping_type: 'partial',
    coverage_percentage: 60,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA broader on communication; NIS2 focuses on customer threat notification.',
  },

  // ============================================================================
  // ICT Incident Reporting (DORA Arts. 17-23) → NIS2 Reporting (Art. 23)
  // ============================================================================
  {
    id: 'dora-nis2-011',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-17',        // ICT Incident Classification
    target_framework: 'nis2',
    target_requirement_id: 'nis2-23-1',         // Significant Incident Notification
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both define incident classification criteria; DORA more prescriptive on thresholds.',
  },
  {
    id: 'dora-nis2-012',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-19',        // Incident Reporting to Authorities
    target_framework: 'nis2',
    target_requirement_id: 'nis2-23-4a',        // Early Warning (24h)
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require early notification within 24 hours of significant incidents.',
  },
  {
    id: 'dora-nis2-013',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-19',        // Incident Reporting
    target_framework: 'nis2',
    target_requirement_id: 'nis2-23-4b',        // Incident Notification (72h)
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require detailed notification within 72 hours.',
  },
  {
    id: 'dora-nis2-014',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-19',        // Incident Reporting
    target_framework: 'nis2',
    target_requirement_id: 'nis2-23-4c',        // Final Report (1 month)
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require final incident report within one month.',
  },

  // ============================================================================
  // Resilience Testing (DORA Arts. 24-27) → NIS2 Testing Requirements
  // ============================================================================
  {
    id: 'dora-nis2-015',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-24',        // General Testing Req
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2f',        // Assessment of Measures
    mapping_type: 'partial',
    coverage_percentage: 65,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA has extensive testing requirements; NIS2 requires effectiveness assessment.',
  },
  {
    id: 'dora-nis2-016',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-25',        // Testing Requirements
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-vuln-mgmt', // Vulnerability Management
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'DORA testing includes vulnerability assessments covered in NIS2.',
  },

  // ============================================================================
  // Third-Party Risk (DORA Arts. 28-44) → NIS2 Supply Chain (Art. 21(2)(d))
  // ============================================================================
  {
    id: 'dora-nis2-017',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-28',        // Third-Party Risk Policy
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2d',        // Supply Chain Security
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require supplier/third-party risk management; DORA more detailed for ICT.',
  },
  {
    id: 'dora-nis2-018',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-29',        // Assessment of Providers
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-vendor-assess', // Supplier Assessment
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require assessment of supplier security practices.',
  },
  {
    id: 'dora-nis2-019',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-30',        // Contractual Requirements
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-vendor-contract', // Security Contractual Requirements
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require security requirements in supplier contracts.',
  },

  // ============================================================================
  // Governance → Governance
  // ============================================================================
  {
    id: 'dora-nis2-020',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-5',         // Management Body Role
    target_framework: 'nis2',
    target_requirement_id: 'nis2-20-1',         // Management Body Accountability
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require management body accountability for cybersecurity.',
  },
  {
    id: 'dora-nis2-021',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-13',        // Training Requirements
    target_framework: 'nis2',
    target_requirement_id: 'nis2-20-2',         // Management Body Training
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require management training on cybersecurity.',
  },
  {
    id: 'dora-nis2-022',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-13',        // Awareness Programs
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2g',        // Basic Cyber Hygiene
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require cybersecurity awareness training for staff.',
  },

  // ============================================================================
  // Business Continuity
  // ============================================================================
  {
    id: 'dora-nis2-023',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',        // Business Continuity Policy
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2c',        // Business Continuity & Crisis Mgmt
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require business continuity and disaster recovery capabilities.',
  },
  {
    id: 'dora-nis2-024',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',        // Recovery Procedures
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-recovery',  // System Recovery
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require documented recovery procedures and testing.',
  },

  // ============================================================================
  // Access Control
  // ============================================================================
  {
    id: 'dora-nis2-025',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',         // Access Control Requirements
    target_framework: 'nis2',
    target_requirement_id: 'nis2-21-2i',        // HR Security & Access Control
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require access control; NIS2 explicitly includes HR security.',
  },
  {
    id: 'dora-nis2-026',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',         // Privileged Access
    target_framework: 'nis2',
    target_requirement_id: 'nis2-rm-privileged', // Privileged Access Management
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require controls for privileged access management.',
  },
];

export const DORA_NIS2_MAPPING_COUNT = DORA_NIS2_MAPPINGS.length;

/**
 * Get coverage statistics for DORA to NIS2 mapping
 */
export function getDORAtoNIS2CoverageStats() {
  const total = DORA_NIS2_MAPPINGS.length;
  const byType = DORA_NIS2_MAPPINGS.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = DORA_NIS2_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / total;
  const avgConfidence = DORA_NIS2_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / total;

  return {
    total_mappings: total,
    by_type: byType,
    average_coverage: Math.round(avgCoverage),
    average_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
