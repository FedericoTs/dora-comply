/**
 * GDPR Article 32 Requirements
 *
 * General Data Protection Regulation (EU 2016/679)
 * Article 32: Security of Processing
 *
 * Requires appropriate technical and organizational measures to ensure
 * a level of security appropriate to the risk.
 */

import { FrameworkRequirement } from './framework-types';

export const GDPR_REQUIREMENTS: FrameworkRequirement[] = [
  // ============================================================================
  // TECHNICAL MEASURES - Article 32(1)(a)
  // ============================================================================
  {
    id: 'gdpr-32-1a-pseudo',
    framework: 'gdpr',
    article_number: '32(1)(a)',
    title: 'Pseudonymisation',
    description: 'Implementation of pseudonymisation measures to reduce risks to data subjects by replacing directly identifying information with artificial identifiers.',
    category: 'technical_measures',
    priority: 'high',
    evidence_types: ['technical_control', 'procedure', 'data_flow_diagram'],
    applicability: ['all'],
    sort_order: 1,
    implementation_guidance: 'Implement data masking and tokenization for personal data. Keep mapping tables separate and secured.',
    regulatory_reference: 'GDPR Article 32(1)(a)',
  },
  {
    id: 'gdpr-32-1a-encrypt',
    framework: 'gdpr',
    article_number: '32(1)(a)',
    title: 'Encryption of Personal Data',
    description: 'Implementation of encryption for personal data both at rest and in transit to protect against unauthorized access.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['technical_control', 'encryption_config', 'policy'],
    applicability: ['all'],
    sort_order: 2,
    implementation_guidance: 'Use AES-256 for data at rest, TLS 1.2+ for data in transit. Implement proper key management.',
    regulatory_reference: 'GDPR Article 32(1)(a)',
  },

  // ============================================================================
  // CIA TRIAD - Article 32(1)(b)
  // ============================================================================
  {
    id: 'gdpr-32-1b-conf',
    framework: 'gdpr',
    article_number: '32(1)(b)',
    title: 'Confidentiality of Processing Systems',
    description: 'Ensure ongoing confidentiality of processing systems and services through access controls and data protection measures.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['technical_control', 'access_review', 'policy', 'procedure'],
    applicability: ['all'],
    sort_order: 3,
    implementation_guidance: 'Implement role-based access control. Enforce least privilege. Conduct regular access reviews.',
    regulatory_reference: 'GDPR Article 32(1)(b)',
  },
  {
    id: 'gdpr-32-1b-integ',
    framework: 'gdpr',
    article_number: '32(1)(b)',
    title: 'Integrity of Processing Systems',
    description: 'Ensure ongoing integrity of processing systems and services through data validation, checksums, and change management.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['technical_control', 'procedure', 'monitoring_evidence'],
    applicability: ['all'],
    sort_order: 4,
    implementation_guidance: 'Implement data validation controls. Use checksums and digital signatures. Monitor for unauthorized changes.',
    regulatory_reference: 'GDPR Article 32(1)(b)',
  },
  {
    id: 'gdpr-32-1b-avail',
    framework: 'gdpr',
    article_number: '32(1)(b)',
    title: 'Availability of Processing Systems',
    description: 'Ensure ongoing availability of processing systems and services through redundancy, backups, and disaster recovery.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['technical_control', 'bcp_drp', 'monitoring_evidence'],
    applicability: ['all'],
    sort_order: 5,
    implementation_guidance: 'Implement high availability architecture. Maintain redundant systems. Define and meet availability SLAs.',
    regulatory_reference: 'GDPR Article 32(1)(b)',
  },

  // ============================================================================
  // RESILIENCE - Article 32(1)(c)
  // ============================================================================
  {
    id: 'gdpr-32-1c-resilience',
    framework: 'gdpr',
    article_number: '32(1)(c)',
    title: 'Resilience of Processing Systems',
    description: 'Ability of processing systems and services to withstand and recover from disruptive events.',
    category: 'technical_measures',
    priority: 'high',
    evidence_types: ['technical_control', 'bcp_drp', 'penetration_test'],
    applicability: ['all'],
    sort_order: 6,
    implementation_guidance: 'Design systems for resilience. Implement auto-scaling and failover. Test disaster recovery regularly.',
    regulatory_reference: 'GDPR Article 32(1)(c)',
  },
  {
    id: 'gdpr-32-1c-restore',
    framework: 'gdpr',
    article_number: '32(1)(c)',
    title: 'Timely Restoration of Access',
    description: 'Ability to restore availability and access to personal data in a timely manner following a physical or technical incident.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['bcp_drp', 'procedure', 'technical_control'],
    applicability: ['all'],
    sort_order: 7,
    implementation_guidance: 'Define RTO/RPO objectives. Implement automated backup and restore. Test recovery procedures quarterly.',
    regulatory_reference: 'GDPR Article 32(1)(c)',
  },

  // ============================================================================
  // TESTING & EVALUATION - Article 32(1)(d)
  // ============================================================================
  {
    id: 'gdpr-32-1d-test',
    framework: 'gdpr',
    article_number: '32(1)(d)',
    title: 'Regular Testing of Security Measures',
    description: 'Process for regularly testing technical and organizational measures to ensure their effectiveness.',
    category: 'organizational_measures',
    priority: 'high',
    evidence_types: ['penetration_test', 'vulnerability_scan', 'audit_report', 'procedure'],
    applicability: ['all'],
    sort_order: 8,
    implementation_guidance: 'Conduct annual penetration tests. Run quarterly vulnerability scans. Test incident response procedures.',
    regulatory_reference: 'GDPR Article 32(1)(d)',
  },
  {
    id: 'gdpr-32-1d-assess',
    framework: 'gdpr',
    article_number: '32(1)(d)',
    title: 'Security Measure Assessment',
    description: 'Process for assessing the effectiveness of technical and organizational measures.',
    category: 'organizational_measures',
    priority: 'high',
    evidence_types: ['audit_report', 'procedure', 'risk_assessment'],
    applicability: ['all'],
    sort_order: 9,
    implementation_guidance: 'Conduct annual security assessments. Review control effectiveness. Update measures based on findings.',
    regulatory_reference: 'GDPR Article 32(1)(d)',
  },
  {
    id: 'gdpr-32-1d-eval',
    framework: 'gdpr',
    article_number: '32(1)(d)',
    title: 'Evaluation of Security Effectiveness',
    description: 'Process for evaluating the overall effectiveness of security measures in protecting personal data.',
    category: 'organizational_measures',
    priority: 'high',
    evidence_types: ['audit_report', 'risk_assessment', 'procedure'],
    applicability: ['all'],
    sort_order: 10,
    implementation_guidance: 'Track security metrics. Review incident trends. Benchmark against industry standards.',
    regulatory_reference: 'GDPR Article 32(1)(d)',
  },

  // ============================================================================
  // RISK ASSESSMENT - Article 32(2)
  // ============================================================================
  {
    id: 'gdpr-32-2-risk',
    framework: 'gdpr',
    article_number: '32(2)',
    title: 'Risk Assessment for Processing',
    description: 'Assessment of risks to rights and freedoms of data subjects from accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.',
    category: 'risk_assessment',
    priority: 'critical',
    evidence_types: ['risk_assessment', 'procedure', 'policy'],
    applicability: ['all'],
    sort_order: 11,
    implementation_guidance: 'Conduct DPIAs for high-risk processing. Assess likelihood and severity of harm to data subjects.',
    regulatory_reference: 'GDPR Article 32(2)',
  },
  {
    id: 'gdpr-32-2-destruction',
    framework: 'gdpr',
    article_number: '32(2)',
    title: 'Protection Against Data Destruction',
    description: 'Measures to protect against accidental or unlawful destruction of personal data.',
    category: 'technical_measures',
    priority: 'high',
    evidence_types: ['technical_control', 'procedure', 'bcp_drp'],
    applicability: ['all'],
    sort_order: 12,
    implementation_guidance: 'Implement backup and recovery. Use immutable storage for critical data. Protect against ransomware.',
    regulatory_reference: 'GDPR Article 32(2)',
  },
  {
    id: 'gdpr-32-2-loss',
    framework: 'gdpr',
    article_number: '32(2)',
    title: 'Protection Against Data Loss',
    description: 'Measures to protect against loss of personal data through robust backup and redundancy.',
    category: 'technical_measures',
    priority: 'high',
    evidence_types: ['technical_control', 'procedure', 'monitoring_evidence'],
    applicability: ['all'],
    sort_order: 13,
    implementation_guidance: 'Implement 3-2-1 backup rule. Test restore procedures. Monitor backup success rates.',
    regulatory_reference: 'GDPR Article 32(2)',
  },
  {
    id: 'gdpr-32-2-alteration',
    framework: 'gdpr',
    article_number: '32(2)',
    title: 'Protection Against Unauthorized Alteration',
    description: 'Measures to protect against unauthorized alteration of personal data through access controls and audit logging.',
    category: 'technical_measures',
    priority: 'high',
    evidence_types: ['technical_control', 'access_review', 'monitoring_evidence'],
    applicability: ['all'],
    sort_order: 14,
    implementation_guidance: 'Implement change management. Log all data modifications. Use database audit features.',
    regulatory_reference: 'GDPR Article 32(2)',
  },
  {
    id: 'gdpr-32-2-disclosure',
    framework: 'gdpr',
    article_number: '32(2)',
    title: 'Protection Against Unauthorized Disclosure',
    description: 'Measures to protect against unauthorized disclosure of or access to personal data.',
    category: 'technical_measures',
    priority: 'critical',
    evidence_types: ['technical_control', 'encryption_config', 'access_review', 'policy'],
    applicability: ['all'],
    sort_order: 15,
    implementation_guidance: 'Implement DLP controls. Encrypt sensitive data. Monitor data access patterns.',
    regulatory_reference: 'GDPR Article 32(2)',
  },

  // ============================================================================
  // ORGANIZATIONAL MEASURES
  // ============================================================================
  {
    id: 'gdpr-32-org-policy',
    framework: 'gdpr',
    article_number: '32',
    title: 'Information Security Policy',
    description: 'Documented information security policy covering the protection of personal data.',
    category: 'organizational_measures',
    priority: 'critical',
    evidence_types: ['policy', 'procedure'],
    applicability: ['all'],
    sort_order: 20,
    implementation_guidance: 'Document comprehensive security policy. Include data protection requirements. Review annually.',
    regulatory_reference: 'GDPR Article 32',
  },
  {
    id: 'gdpr-32-org-training',
    framework: 'gdpr',
    article_number: '32',
    title: 'Staff Training and Awareness',
    description: 'Training programs for staff handling personal data on security awareness and data protection.',
    category: 'organizational_measures',
    priority: 'high',
    evidence_types: ['training_records', 'policy', 'procedure'],
    applicability: ['all'],
    sort_order: 21,
    implementation_guidance: 'Implement mandatory data protection training. Include GDPR awareness. Test comprehension.',
    regulatory_reference: 'GDPR Article 32',
  },
  {
    id: 'gdpr-32-org-vendor',
    framework: 'gdpr',
    article_number: '32',
    title: 'Processor Security Requirements',
    description: 'Ensuring processors (third parties) implement appropriate security measures as per Article 28.',
    category: 'organizational_measures',
    priority: 'high',
    evidence_types: ['vendor_assessment', 'contract', 'soc2_report'],
    applicability: ['all'],
    sort_order: 22,
    implementation_guidance: 'Include security requirements in DPAs. Verify processor security controls. Monitor compliance.',
    regulatory_reference: 'GDPR Article 32 / Article 28',
  },
  {
    id: 'gdpr-32-org-incident',
    framework: 'gdpr',
    article_number: '32',
    title: 'Security Incident Response',
    description: 'Procedures for detecting, responding to, and reporting security incidents affecting personal data.',
    category: 'organizational_measures',
    priority: 'critical',
    evidence_types: ['procedure', 'incident_log', 'policy'],
    applicability: ['all'],
    sort_order: 23,
    implementation_guidance: 'Define breach notification procedures (72-hour requirement). Establish incident response team.',
    regulatory_reference: 'GDPR Article 32 / Article 33',
  },
  {
    id: 'gdpr-32-org-access',
    framework: 'gdpr',
    article_number: '32',
    title: 'Access Control Policy',
    description: 'Policy and procedures for controlling access to personal data based on need-to-know principle.',
    category: 'organizational_measures',
    priority: 'critical',
    evidence_types: ['policy', 'procedure', 'access_review'],
    applicability: ['all'],
    sort_order: 24,
    implementation_guidance: 'Document access control policy. Implement RBAC. Conduct quarterly access reviews.',
    regulatory_reference: 'GDPR Article 32',
  },
];

export const GDPR_REQUIREMENT_COUNT = GDPR_REQUIREMENTS.length;

export function getGDPRRequirementsByCategory(category: string): FrameworkRequirement[] {
  return GDPR_REQUIREMENTS.filter(r => r.category === category);
}

export function getGDPRRequirementById(id: string): FrameworkRequirement | undefined {
  return GDPR_REQUIREMENTS.find(r => r.id === id);
}

export function getGDPRCriticalRequirements(): FrameworkRequirement[] {
  return GDPR_REQUIREMENTS.filter(r => r.priority === 'critical');
}
