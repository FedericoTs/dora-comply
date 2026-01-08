/**
 * DORA to GDPR Article 32 Cross-Framework Mappings
 *
 * GDPR Article 32 focuses on security of processing for personal data.
 * DORA has broader ICT resilience scope but overlaps on:
 * - Technical security measures (encryption, access control)
 * - Incident response (both require breach response)
 * - Testing and assessment of measures
 * - Business continuity / availability
 */

import { CrossFrameworkMapping } from '../framework-types';

export const DORA_GDPR_MAPPINGS: CrossFrameworkMapping[] = [
  // ============================================================================
  // Protection & Prevention → Technical Measures
  // ============================================================================
  {
    id: 'dora-gdpr-001',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-8',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1a-encrypt',    // Encryption
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require encryption for data protection.',
  },
  {
    id: 'dora-gdpr-002',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-8',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1a-pseudo',     // Pseudonymisation
    mapping_type: 'partial',
    coverage_percentage: 50,
    confidence: 0.70,
    bidirectional: false,
    notes: 'DORA covers data protection broadly; GDPR specifically mentions pseudonymisation.',
  },
  {
    id: 'dora-gdpr-003',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1b-conf',       // Confidentiality
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require confidentiality controls including access management.',
  },
  {
    id: 'dora-gdpr-004',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1b-integ',      // Integrity
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require integrity controls and monitoring.',
  },
  {
    id: 'dora-gdpr-005',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1b-avail',      // Availability
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require availability through redundancy and backup.',
  },
  {
    id: 'dora-gdpr-006',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-2-disclosure',  // Protection Against Disclosure
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require protection against unauthorized access/disclosure.',
  },

  // ============================================================================
  // Response & Recovery → Resilience & Restoration
  // ============================================================================
  {
    id: 'dora-gdpr-007',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-10',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1c-resilience', // Resilience
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'DORA has extensive resilience requirements; GDPR mentions resilience generally.',
  },
  {
    id: 'dora-gdpr-008',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1c-restore',    // Timely Restoration
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require ability to restore access/availability after incidents.',
  },
  {
    id: 'dora-gdpr-009',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-2-destruction', // Protection Against Destruction
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require protection against data destruction via backup/recovery.',
  },
  {
    id: 'dora-gdpr-010',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-11',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-2-loss',        // Protection Against Loss
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require protection against data loss via backup procedures.',
  },

  // ============================================================================
  // Incident Management → Incident Response
  // ============================================================================
  {
    id: 'dora-gdpr-011',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-17',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-org-incident',  // Security Incident Response
    mapping_type: 'equivalent',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require incident response procedures; GDPR has 72-hour breach notification.',
  },

  // ============================================================================
  // Testing Requirements → Assessment
  // ============================================================================
  {
    id: 'dora-gdpr-012',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-24',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1d-test',       // Regular Testing
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA testing requirements more extensive; GDPR requires regular testing.',
  },
  {
    id: 'dora-gdpr-013',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-25',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1d-assess',     // Security Assessment
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA has detailed testing; GDPR requires effectiveness assessment.',
  },
  {
    id: 'dora-gdpr-014',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-12',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-1d-eval',       // Evaluation
    mapping_type: 'partial',
    coverage_percentage: 65,
    confidence: 0.75,
    bidirectional: true,
    notes: 'Both require evaluation and continuous improvement.',
  },

  // ============================================================================
  // Risk Management → Risk Assessment
  // ============================================================================
  {
    id: 'dora-gdpr-015',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-5',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-2-risk',        // Risk Assessment
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: true,
    notes: 'DORA focuses on ICT risks; GDPR on risks to data subject rights.',
  },

  // ============================================================================
  // Organizational Measures
  // ============================================================================
  {
    id: 'dora-gdpr-016',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-5',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-org-policy',    // Security Policy
    mapping_type: 'equivalent',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require documented security policies.',
  },
  {
    id: 'dora-gdpr-017',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-13',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-org-training',  // Staff Training
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require security awareness training.',
  },
  {
    id: 'dora-gdpr-018',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-28',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-org-vendor',    // Processor Security
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'DORA covers ICT third-parties; GDPR focuses on data processors.',
  },
  {
    id: 'dora-gdpr-019',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-org-access',    // Access Control Policy
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require access control policies based on need-to-know.',
  },
  {
    id: 'dora-gdpr-020',
    source_framework: 'dora',
    source_requirement_id: 'dora-art-9',
    target_framework: 'gdpr',
    target_requirement_id: 'gdpr-32-2-alteration',  // Protection Against Alteration
    mapping_type: 'equivalent',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require controls against unauthorized data modification.',
  },
];

export const DORA_GDPR_MAPPING_COUNT = DORA_GDPR_MAPPINGS.length;

/**
 * Get coverage statistics for DORA to GDPR mapping
 */
export function getDORAtoGDPRCoverageStats() {
  const total = DORA_GDPR_MAPPINGS.length;
  const byType = DORA_GDPR_MAPPINGS.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = DORA_GDPR_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / total;
  const avgConfidence = DORA_GDPR_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / total;

  return {
    total_mappings: total,
    by_type: byType,
    average_coverage: Math.round(avgCoverage),
    average_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
