/**
 * GDPR Article 32 to ISO 27001:2022 Cross-Framework Mappings
 *
 * Strong alignment (~85%) between GDPR security requirements and ISO 27001:
 * - GDPR Article 32 defines security of processing requirements
 * - ISO 27001 Annex A provides specific controls that satisfy GDPR
 *
 * Implementing ISO 27001 provides significant GDPR Article 32 coverage.
 */

import { CrossFrameworkMapping } from '../framework-types';

export const GDPR_ISO27001_MAPPINGS: CrossFrameworkMapping[] = [
  // ============================================================================
  // Pseudonymisation & Encryption (GDPR 32(1)(a)) → ISO 27001 Crypto & Data Masking
  // ============================================================================
  {
    id: 'gdpr-iso-001',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1a-pseudo',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.11',  // Data Masking
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.8.11 Data Masking directly addresses GDPR pseudonymisation requirements.',
  },
  {
    id: 'gdpr-iso-002',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1a-encrypt',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.24',  // Use of Cryptography
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.8.24 comprehensively covers encryption requirements for data protection.',
  },
  {
    id: 'gdpr-iso-003',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1a-encrypt',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.14',  // Information Transfer
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'ISO A.5.14 covers secure transfer which supports encryption in transit requirements.',
  },

  // ============================================================================
  // Confidentiality (GDPR 32(1)(b)) → ISO 27001 Access Controls
  // ============================================================================
  {
    id: 'gdpr-iso-004',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.15',  // Access Control
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.5.15 establishes comprehensive access control aligned with GDPR confidentiality.',
  },
  {
    id: 'gdpr-iso-005',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.2',   // Privileged Access Rights
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: true,
    notes: 'ISO A.8.2 provides privileged access controls supporting confidentiality.',
  },
  {
    id: 'gdpr-iso-006',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.3',   // Information Access Restriction
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'ISO A.8.3 restricts information access supporting GDPR confidentiality.',
  },
  {
    id: 'gdpr-iso-007',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.17',  // Authentication Information
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Strong authentication supports confidentiality requirements.',
  },

  // ============================================================================
  // Integrity (GDPR 32(1)(b)) → ISO 27001 Data Protection Controls
  // ============================================================================
  {
    id: 'gdpr-iso-008',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-integ',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.9',   // Configuration Management
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Configuration management helps ensure system integrity.',
  },
  {
    id: 'gdpr-iso-009',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-integ',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.19',  // Installation of Software
    mapping_type: 'partial',
    coverage_percentage: 65,
    confidence: 0.80,
    bidirectional: false,
    notes: 'Controlled software installation supports system integrity.',
  },
  {
    id: 'gdpr-iso-010',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-integ',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.16',  // Monitoring Activities
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Monitoring helps detect integrity violations.',
  },

  // ============================================================================
  // Availability (GDPR 32(1)(b)) → ISO 27001 Business Continuity
  // ============================================================================
  {
    id: 'gdpr-iso-011',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-avail',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.29',  // Information Security During Disruption
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.5.29 directly addresses availability during disruptions.',
  },
  {
    id: 'gdpr-iso-012',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-avail',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.30',  // ICT Readiness for Business Continuity
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.5.30 ensures ICT availability supporting GDPR requirements.',
  },
  {
    id: 'gdpr-iso-013',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-resil',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.14',  // Redundancy
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'ISO A.8.14 redundancy directly supports system resilience.',
  },

  // ============================================================================
  // Restoration Capability (GDPR 32(1)(c)) → ISO 27001 Backup & Recovery
  // ============================================================================
  {
    id: 'gdpr-iso-014',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1c',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.13',  // Information Backup
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.8.13 comprehensively covers backup requirements for restoration.',
  },
  {
    id: 'gdpr-iso-015',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1c',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.30',  // ICT Readiness for Business Continuity
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: false,
    notes: 'Business continuity planning supports restoration capabilities.',
  },

  // ============================================================================
  // Testing & Assessment (GDPR 32(1)(d)) → ISO 27001 Testing Controls
  // ============================================================================
  {
    id: 'gdpr-iso-016',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1d',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.35',  // Independent Review of Information Security
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO A.5.35 independent reviews directly satisfy GDPR testing requirements.',
  },
  {
    id: 'gdpr-iso-017',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1d',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.36',  // Compliance with Policies and Standards
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Compliance verification supports GDPR assessment requirements.',
  },
  {
    id: 'gdpr-iso-018',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1d',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.8',   // Management of Technical Vulnerabilities
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Vulnerability management supports security testing.',
  },

  // ============================================================================
  // Risk Assessment (GDPR 32(2)) → ISO 27001 Risk Management
  // ============================================================================
  {
    id: 'gdpr-iso-019',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-2',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.1',   // Policies for Information Security
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Security policies inform risk-appropriate measures.',
  },

  // ============================================================================
  // Personnel Security (GDPR 32(4)) → ISO 27001 People Controls
  // ============================================================================
  {
    id: 'gdpr-iso-020',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-4',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.1',   // Screening
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Personnel screening ensures trustworthy data access.',
  },
  {
    id: 'gdpr-iso-021',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-4',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.2',   // Terms and Conditions of Employment
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Employment terms establish security obligations.',
  },
  {
    id: 'gdpr-iso-022',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-4',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.3',   // Information Security Awareness
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Security awareness ensures personnel understand GDPR obligations.',
  },
  {
    id: 'gdpr-iso-023',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-4',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.5',   // Responsibilities After Termination
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Post-employment controls prevent unauthorized access.',
  },

  // ============================================================================
  // Incident Management → ISO 27001 Incident Response
  // ============================================================================
  {
    id: 'gdpr-iso-024',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-breach-notification',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.24',  // Information Security Incident Management
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'ISO incident management supports GDPR breach notification requirements.',
  },
  {
    id: 'gdpr-iso-025',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-breach-notification',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.25',  // Assessment and Decision on Security Events
    mapping_type: 'partial',
    coverage_percentage: 80,
    confidence: 0.90,
    bidirectional: false,
    notes: 'Event assessment helps determine breach notification requirements.',
  },
  {
    id: 'gdpr-iso-026',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-breach-notification',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.26',  // Response to Information Security Incidents
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Incident response procedures support timely breach handling.',
  },

  // ============================================================================
  // Physical Security → ISO 27001 Physical Controls
  // ============================================================================
  {
    id: 'gdpr-iso-027',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A7.1',   // Physical Security Perimeters
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.85,
    bidirectional: false,
    notes: 'Physical security perimeters protect data confidentiality.',
  },
  {
    id: 'gdpr-iso-028',
    source_framework: 'gdpr',
    source_requirement_id: 'gdpr-32-1b-conf',
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A7.4',   // Physical Security Monitoring
    mapping_type: 'partial',
    coverage_percentage: 65,
    confidence: 0.80,
    bidirectional: false,
    notes: 'Physical monitoring supports confidentiality protection.',
  },
];

export const GDPR_ISO27001_MAPPING_COUNT = GDPR_ISO27001_MAPPINGS.length;

/**
 * Get coverage statistics for GDPR to ISO 27001 mapping
 */
export function getGDPRtoISO27001CoverageStats() {
  const total = GDPR_ISO27001_MAPPINGS.length;
  const byType = GDPR_ISO27001_MAPPINGS.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = GDPR_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / total;
  const avgConfidence = GDPR_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / total;

  return {
    total_mappings: total,
    by_type: byType,
    average_coverage: Math.round(avgCoverage),
    average_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
