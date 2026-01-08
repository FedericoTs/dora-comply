/**
 * NIS2 to ISO 27001:2022 Cross-Framework Mappings
 *
 * Strong alignment (~80% overlap):
 * - ISO 27001 certification often helps demonstrate NIS2 compliance
 * - NIS2 risk management measures map well to ISO 27001 Annex A
 * - ISO provides implementation framework for NIS2 requirements
 */

import { CrossFrameworkMapping } from '../framework-types';

export const NIS2_ISO27001_MAPPINGS: CrossFrameworkMapping[] = [
  // ============================================================================
  // Governance → Organizational Controls
  // ============================================================================
  {
    id: 'nis2-iso-001',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-20-1',           // Management Body Accountability
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.4',            // Management Responsibilities
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require management accountability for security.',
  },
  {
    id: 'nis2-iso-002',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-20-2',           // Management Body Training
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.3',            // Security Awareness Training
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: false,
    notes: 'NIS2 specifically requires management training; ISO covers all personnel.',
  },
  {
    id: 'nis2-iso-003',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-20-3',           // Employee Training
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.3',            // Security Awareness Training
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require regular security awareness training for all staff.',
  },

  // ============================================================================
  // Risk Management Measures → Organizational & Technological Controls
  // ============================================================================
  {
    id: 'nis2-iso-004',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-1',           // All-Hazards Approach
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.1',            // Policies for Information Security
    mapping_type: 'partial',
    coverage_percentage: 75,
    confidence: 0.85,
    bidirectional: true,
    notes: 'Both require comprehensive risk-based security approach.',
  },
  {
    id: 'nis2-iso-005',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2a',          // Risk Analysis Policies
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.1',            // Security Policies
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require documented security policies.',
  },
  {
    id: 'nis2-iso-006',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2e',          // Security in Systems
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.25',           // Secure Development Life Cycle
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both address security in system development and maintenance.',
  },
  {
    id: 'nis2-iso-007',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2e',          // Vulnerability Handling
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.8',            // Management of Technical Vulnerabilities
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require vulnerability management processes.',
  },
  {
    id: 'nis2-iso-008',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2f',          // Cybersecurity Measure Assessment
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.35',           // Independent Review
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require assessment of security measure effectiveness.',
  },
  {
    id: 'nis2-iso-009',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2g',          // Basic Cyber Hygiene
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A6.3',            // Security Awareness Training
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require cyber hygiene practices and training.',
  },
  {
    id: 'nis2-iso-010',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2h',          // Cryptography & Encryption
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.24',           // Use of Cryptography
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require cryptography policies and implementation.',
  },
  {
    id: 'nis2-iso-011',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2i',          // HR Security & Access Control
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.15',           // Access Control
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require access control policies.',
  },
  {
    id: 'nis2-iso-012',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2i',          // Asset Management
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.9',            // Inventory of Assets
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require asset inventory and management.',
  },
  {
    id: 'nis2-iso-013',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2j',          // MFA
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.5',            // Secure Authentication
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require strong authentication including MFA.',
  },

  // ============================================================================
  // Incident Handling → Incident Management
  // ============================================================================
  {
    id: 'nis2-iso-014',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2b',          // Incident Handling
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.24',           // Incident Management Planning
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require incident management planning and preparation.',
  },
  {
    id: 'nis2-iso-015',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-detection',   // Detection Capabilities
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.16',           // Monitoring Activities
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require security monitoring and detection.',
  },
  {
    id: 'nis2-iso-016',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-analysis',    // Incident Analysis
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.25',           // Assessment and Decision on Events
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require incident classification and analysis.',
  },
  {
    id: 'nis2-iso-017',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-containment', // Incident Containment
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.26',           // Response to Incidents
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require incident response and containment.',
  },

  // ============================================================================
  // Business Continuity → BCP Controls
  // ============================================================================
  {
    id: 'nis2-iso-018',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2c',          // Business Continuity
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.30',           // ICT Readiness for Business Continuity
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require ICT business continuity planning.',
  },
  {
    id: 'nis2-iso-019',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-backup',      // Backup Management
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.13',           // Information Backup
    mapping_type: 'equivalent',
    coverage_percentage: 95,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require backup management and testing.',
  },
  {
    id: 'nis2-iso-020',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-recovery',    // System Recovery
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.29',           // Security During Disruption
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require recovery capabilities.',
  },

  // ============================================================================
  // Supply Chain Security → Supplier Management
  // ============================================================================
  {
    id: 'nis2-iso-021',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-2d',          // Supply Chain Security
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.19',           // Supplier Relationships Security
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require supplier security risk management.',
  },
  {
    id: 'nis2-iso-022',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-vendor-assess', // Supplier Assessment
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.21',           // Managing ICT Supply Chain Security
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require ICT supply chain security management.',
  },
  {
    id: 'nis2-iso-023',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-vendor-contract', // Security Contractual Requirements
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.20',           // Security in Supplier Agreements
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require security clauses in supplier contracts.',
  },

  // ============================================================================
  // Reporting → Contact with Authorities
  // ============================================================================
  {
    id: 'nis2-iso-024',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-23-1',           // Significant Incident Notification
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.5',            // Contact with Authorities
    mapping_type: 'partial',
    coverage_percentage: 60,
    confidence: 0.75,
    bidirectional: false,
    notes: 'NIS2 has specific reporting timelines; ISO requires established contacts.',
  },
  {
    id: 'nis2-iso-025',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-23-4c',          // Final Incident Report
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.27',           // Learning from Incidents
    mapping_type: 'partial',
    coverage_percentage: 70,
    confidence: 0.80,
    bidirectional: true,
    notes: 'Both require post-incident analysis; NIS2 has reporting requirement.',
  },

  // ============================================================================
  // Additional Technical Controls
  // ============================================================================
  {
    id: 'nis2-iso-026',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-network-sec', // Network Security
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.20',           // Networks Security
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require network security controls.',
  },
  {
    id: 'nis2-iso-027',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-endpoint',    // Endpoint Protection
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.1',            // User Endpoint Devices
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require endpoint protection.',
  },
  {
    id: 'nis2-iso-028',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-access-mgmt', // Access Management
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.18',           // Access Rights
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require access rights management.',
  },
  {
    id: 'nis2-iso-029',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-privileged',  // Privileged Access Management
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.2',            // Privileged Access Rights
    mapping_type: 'equivalent',
    coverage_percentage: 90,
    confidence: 0.95,
    bidirectional: true,
    notes: 'Both require privileged access management.',
  },
  {
    id: 'nis2-iso-030',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-rm-secure-dev',  // Secure Development
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A8.28',           // Secure Coding
    mapping_type: 'equivalent',
    coverage_percentage: 85,
    confidence: 0.90,
    bidirectional: true,
    notes: 'Both require secure development practices.',
  },
  {
    id: 'nis2-iso-031',
    source_framework: 'nis2',
    source_requirement_id: 'nis2-21-4',           // European/International Standards
    target_framework: 'iso27001',
    target_requirement_id: 'iso-A5.36',           // Compliance with Policies & Standards
    mapping_type: 'supports',
    coverage_percentage: 80,
    confidence: 0.85,
    bidirectional: false,
    notes: 'ISO 27001 certification helps demonstrate NIS2 standards compliance.',
  },
];

export const NIS2_ISO27001_MAPPING_COUNT = NIS2_ISO27001_MAPPINGS.length;

/**
 * Get coverage statistics for NIS2 to ISO 27001 mapping
 */
export function getNIS2toISO27001CoverageStats() {
  const total = NIS2_ISO27001_MAPPINGS.length;
  const byType = NIS2_ISO27001_MAPPINGS.reduce((acc, m) => {
    acc[m.mapping_type] = (acc[m.mapping_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCoverage = NIS2_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / total;
  const avgConfidence = NIS2_ISO27001_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / total;

  return {
    total_mappings: total,
    by_type: byType,
    average_coverage: Math.round(avgCoverage),
    average_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
