/**
 * DORA to ISO 27001:2022 Cross-Framework Mappings
 *
 * Coverage varies by DORA pillar:
 * - ICT Risk Management: ~75% coverage via A.5, A.8
 * - Incident Reporting: ~80% coverage via A.5.24-5.28
 * - Resilience Testing: ~60% coverage via A.8.8, A.8.16
 * - Third-Party Risk: ~85% coverage via A.5.19-5.23
 */

import { CrossFrameworkMapping } from '../framework-types';

export const DORA_ISO27001_MAPPINGS: CrossFrameworkMapping[] = [
  // ============================================================================
  // ICT Risk Management → ISO 27001 Organizational & Technological Controls
  // ============================================================================
  {
    id: 'dora-iso-001',
    source_framework: 'dora',
    source_requirement_id: 'dora-art5',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.1',          // Policies for Information Security
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require comprehensive security policies approved by management.',
  },
  {
    id: 'dora-iso-002',
    source_framework: 'dora',
    source_requirement_id: 'dora-art5',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.2',          // Security Roles & Responsibilities
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require defined security roles and responsibilities.',
  },
  {
    id: 'dora-iso-003',
    source_framework: 'dora',
    source_requirement_id: 'dora-art6',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.25',         // Secure Development Life Cycle
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'DORA covers ICT systems broadly; ISO focuses on secure development.',
  },
  {
    id: 'dora-iso-004',
    source_framework: 'dora',
    source_requirement_id: 'dora-art7',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.9',          // Inventory of Assets
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require asset inventory and identification.',
  },
  {
    id: 'dora-iso-005',
    source_framework: 'dora',
    source_requirement_id: 'dora-art7',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.12',         // Classification of Information
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require classification; ISO more detailed on labeling.',
  },
  {
    id: 'dora-iso-006',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.24',         // Use of Cryptography
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require cryptography policies and implementation.',
  },
  {
    id: 'dora-iso-007',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.5',          // Secure Authentication
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require strong authentication mechanisms.',
  },
  {
    id: 'dora-iso-008',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.20',         // Networks Security
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require network security controls.',
  },
  {
    id: 'dora-iso-009',
    source_framework: 'dora',
    source_requirement_id: 'dora-art9',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.16',         // Monitoring Activities
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require monitoring for anomalous behavior.',
  },
  {
    id: 'dora-iso-010',
    source_framework: 'dora',
    source_requirement_id: 'dora-art9',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.15',         // Logging
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require comprehensive logging capabilities.',
  },
  {
    id: 'dora-iso-011',
    source_framework: 'dora',
    source_requirement_id: 'dora-art9',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.15',         // Access Control
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require access control policies and procedures.',
  },
  {
    id: 'dora-iso-012',
    source_framework: 'dora',
    source_requirement_id: 'dora-art9',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.2',          // Privileged Access Rights
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require privileged access management.',
  },

  // ============================================================================
  // Response & Recovery → ISO 27001 Incident Management & BCP
  // ============================================================================
  {
    id: 'dora-iso-013',
    source_framework: 'dora',
    source_requirement_id: 'dora-art10',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.26',         // Response to Incidents
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require incident response procedures.',
  },
  {
    id: 'dora-iso-014',
    source_framework: 'dora',
    source_requirement_id: 'dora-art11',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.13',         // Information Backup
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require backup management and testing.',
  },
  {
    id: 'dora-iso-015',
    source_framework: 'dora',
    source_requirement_id: 'dora-art11',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.30',         // ICT Readiness for Business Continuity
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require business continuity planning for ICT.',
  },

  // ============================================================================
  // ICT Incident Reporting → ISO 27001 Incident Management
  // ============================================================================
  {
    id: 'dora-iso-016',
    source_framework: 'dora',
    source_requirement_id: 'dora-art17',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.24',         // Incident Management Planning
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require incident management planning and preparation.',
  },
  {
    id: 'dora-iso-017',
    source_framework: 'dora',
    source_requirement_id: 'dora-art17',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.25',         // Assessment and Decision on Events
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require incident classification and triage.',
  },
  {
    id: 'dora-iso-018',
    source_framework: 'dora',
    source_requirement_id: 'dora-art19',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.5',          // Contact with Authorities
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA prescribes specific reporting timelines; ISO is more general.',
  },
  {
    id: 'dora-iso-019',
    source_framework: 'dora',
    source_requirement_id: 'dora-art12',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.27',         // Learning from Incidents
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require post-incident reviews and lessons learned.',
  },
  {
    id: 'dora-iso-020',
    source_framework: 'dora',
    source_requirement_id: 'dora-art20',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.28',         // Collection of Evidence
    mapping_type: 'equivalent',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require evidence collection and preservation.',
  },

  // ============================================================================
  // Resilience Testing → ISO 27001 Testing & Assessment
  // ============================================================================
  {
    id: 'dora-iso-021',
    source_framework: 'dora',
    source_requirement_id: 'dora-art24',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.8',          // Management of Technical Vulnerabilities
    mapping_type: 'partial',
    coverage_percentage: 65,
    confidence: 0.80,
    bidirectional: false,
    notes: 'DORA testing requirements more extensive; ISO covers vulnerability management.',
  },
  {
    id: 'dora-iso-022',
    source_framework: 'dora',
    source_requirement_id: 'dora-art25',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.29',         // Security Testing in Development
    mapping_type: 'partial',
    coverage_percentage: 60,
    confidence: 0.75,
    bidirectional: false,
    notes: 'DORA requires operational testing; ISO focuses on development testing.',
  },
  {
    id: 'dora-iso-023',
    source_framework: 'dora',
    source_requirement_id: 'dora-art26',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.35',         // Independent Review
    mapping_type: 'partial',
    coverage_percentage: 50,
    confidence: 0.70,
    bidirectional: false,
    notes: 'DORA TLPT is more rigorous than ISO independent review.',
  },

  // ============================================================================
  // Third-Party Risk → ISO 27001 Supplier Management
  // ============================================================================
  {
    id: 'dora-iso-024',
    source_framework: 'dora',
    source_requirement_id: 'dora-art28',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.19',         // Supplier Relationships Security
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require supplier security risk management.',
  },
  {
    id: 'dora-iso-025',
    source_framework: 'dora',
    source_requirement_id: 'dora-art29',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.21',         // Managing Security in ICT Supply Chain
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both address ICT supply chain security.',
  },
  {
    id: 'dora-iso-026',
    source_framework: 'dora',
    source_requirement_id: 'dora-art30',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.20',         // Security in Supplier Agreements
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require security clauses in supplier contracts.',
  },
  {
    id: 'dora-iso-027',
    source_framework: 'dora',
    source_requirement_id: 'dora-art31',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.22',         // Monitoring Supplier Services
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require ongoing monitoring of supplier services.',
  },
  {
    id: 'dora-iso-028',
    source_framework: 'dora',
    source_requirement_id: 'dora-art32',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.23',         // Cloud Services Security
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'DORA has specific cloud concentration risk; ISO covers cloud security generally.',
  },

  // ============================================================================
  // Additional Mappings
  // ============================================================================
  {
    id: 'dora-iso-029',
    source_framework: 'dora',
    source_requirement_id: 'dora-art13',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.3',          // Security Awareness Training
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require security awareness training programs.',
  },
  {
    id: 'dora-iso-030',
    source_framework: 'dora',
    source_requirement_id: 'dora-art14',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.31',         // Legal & Regulatory Requirements
    mapping_type: 'equivalent',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require compliance with legal and regulatory requirements.',
  },
  {
    id: 'dora-iso-031',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.9',          // Configuration Management
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: true,
    notes: 'Both address secure configuration management.',
  },
  {
    id: 'dora-iso-032',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.22',         // Segregation of Networks
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: true,
    notes: 'Both require network segmentation.',
  },
  {
    id: 'dora-iso-033',
    source_framework: 'dora',
    source_requirement_id: 'dora-art8',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.7',          // Protection Against Malware
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require malware protection controls.',
  },
  {
    id: 'dora-iso-034',
    source_framework: 'dora',
    source_requirement_id: 'dora-art6',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.32',         // Change Management
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require change management procedures.',
  },
];

export const DORA_ISO27001_MAPPING_COUNT = DORA_ISO27001_MAPPINGS.length;

/**
 * Get coverage statistics for DORA to ISO 27001 mapping
 */
export function getDORAtoISO27001CoverageStats() {
  const total = DORA_ISO27001_MAPPINGS.length;
  const byType = DORA_ISO27001_MAPPINGS.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = DORA_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / total;
  const avgConfidence = DORA_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / total;

  return {
    total_mappings: total,
    by_type: byType,
    average_coverage: Math.round(avgCoverage),
    average_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
