/**
 * NIS2 Comprehensive Questions Library
 *
 * Complete question bank aligned with NIS2 Directive Article 21(2)(a-j)
 * Based on ENISA guidance, ISO 27001:2022, and NIST CSF 2.0
 *
 * Sources:
 * - NIS2 Directive Article 21: https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html
 * - ENISA Technical Implementation Guidance
 * - 3rdRisk NIS2 Assessment Framework
 * - ISO 27001:2022 Controls
 */

import type { CreateQuestionInput } from './schemas';
import type { NIS2Category } from './types';

// ============================================================================
// QUESTION TEMPLATES BY CATEGORY
// ============================================================================

interface DefaultQuestion extends Omit<CreateQuestionInput, 'template_id' | 'display_order'> {
  ai_extraction_keywords: string[];
}

// ============================================================================
// ARTICLE 21(2)(a): POLICIES ON RISK ANALYSIS & ISMS
// ============================================================================

const POLICIES_QUESTIONS: DefaultQuestion[] = [
  // Governance
  {
    question_text: 'Do you have a formal cybersecurity risk management program with executive oversight?',
    help_text: 'NIS2 requires risk-based cybersecurity approaches with board-level accountability. Leadership must be involved in managing cyber risks.',
    question_type: 'boolean',
    category: 'policies',
    subcategory: 'Governance',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['governance', 'board', 'executive', 'oversight', 'management program', 'CISO'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Does your organization have a documented Information Security Management System (ISMS)?',
    help_text: 'An ISMS is a systematic approach to managing sensitive information. Examples include ISO 27001 certified systems.',
    question_type: 'boolean',
    category: 'policies',
    subcategory: 'Governance',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['ISMS', 'Information Security Management System', 'ISO 27001', 'security management'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you have a designated Chief Information Security Officer (CISO) or equivalent role?',
    help_text: 'A dedicated security leader demonstrates commitment to cybersecurity governance.',
    question_type: 'select',
    category: 'policies',
    subcategory: 'Governance',
    is_required: true,
    options: [
      { value: 'dedicated_ciso', label: 'Yes, dedicated CISO', description: 'Full-time security executive' },
      { value: 'shared_role', label: 'Yes, shared/part-time role', description: 'Security combined with other duties' },
      { value: 'outsourced', label: 'Outsourced/Virtual CISO', description: 'External security leadership' },
      { value: 'no', label: 'No dedicated security role', description: 'No formal security leadership' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['CISO', 'Chief Information Security Officer', 'security officer', 'DPO', 'security leadership'],
    ai_confidence_threshold: 0.6,
  },
  // Certifications
  {
    question_text: 'What security certifications does your organization currently hold?',
    help_text: 'Select all that apply. Recognized frameworks validate that you meet NIS2 baseline requirements.',
    question_type: 'multiselect',
    category: 'policies',
    subcategory: 'Certifications',
    is_required: true,
    options: [
      { value: 'iso27001', label: 'ISO 27001', description: 'Information security management' },
      { value: 'soc2_type2', label: 'SOC 2 Type II', description: 'Service organization controls (annual audit)' },
      { value: 'soc2_type1', label: 'SOC 2 Type I', description: 'Point-in-time SOC 2' },
      { value: 'iso22301', label: 'ISO 22301', description: 'Business continuity' },
      { value: 'pci_dss', label: 'PCI DSS', description: 'Payment card industry' },
      { value: 'c5', label: 'C5 (BSI)', description: 'German cloud security' },
      { value: 'cyber_essentials', label: 'Cyber Essentials (UK)', description: 'UK government-backed scheme' },
      { value: 'tisax', label: 'TISAX', description: 'Automotive industry standard' },
      { value: 'hitrust', label: 'HITRUST', description: 'Healthcare information security' },
      { value: 'fedramp', label: 'FedRAMP', description: 'US federal cloud security' },
      { value: 'none', label: 'No current certifications', description: 'Working towards certification' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['certification', 'certified', 'ISO 27001', 'SOC 2', 'compliance', 'audited'],
    ai_confidence_threshold: 0.8,
  },
  {
    question_text: 'When do your current security certifications expire?',
    help_text: 'Provide expiration dates for each certification held.',
    question_type: 'textarea',
    category: 'policies',
    subcategory: 'Certifications',
    is_required: false,
    validation_rules: { maxLength: 1000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['expiration', 'valid until', 'renewal', 'audit date', 'certificate date'],
    ai_confidence_threshold: 0.5,
  },
  // Risk Assessment
  {
    question_text: 'How frequently do you conduct formal risk assessments?',
    help_text: 'NIS2 requires regular risk assessments of network and information systems.',
    question_type: 'select',
    category: 'policies',
    subcategory: 'Risk Assessment',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous', description: 'Real-time risk monitoring' },
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'ad_hoc', label: 'Ad hoc only', description: 'Only when needed or after incidents' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['risk assessment', 'risk review', 'frequency', 'annual', 'quarterly', 'periodic'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What risk management framework or methodology do you follow?',
    help_text: 'Include the framework used (e.g., ISO 27005, NIST RMF, FAIR) and key processes.',
    question_type: 'multiselect',
    category: 'policies',
    subcategory: 'Risk Assessment',
    is_required: true,
    options: [
      { value: 'iso27005', label: 'ISO 27005', description: 'Information security risk management' },
      { value: 'nist_rmf', label: 'NIST RMF', description: 'Risk Management Framework' },
      { value: 'nist_csf', label: 'NIST CSF', description: 'Cybersecurity Framework' },
      { value: 'fair', label: 'FAIR', description: 'Factor Analysis of Information Risk' },
      { value: 'octave', label: 'OCTAVE', description: 'Carnegie Mellon methodology' },
      { value: 'cobit', label: 'COBIT', description: 'ISACA governance framework' },
      { value: 'custom', label: 'Custom/Internal', description: 'Organization-specific methodology' },
      { value: 'none', label: 'No formal framework', description: 'Informal approach' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['risk management', 'methodology', 'framework', 'ISO 27005', 'NIST', 'FAIR'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Describe your approach to identifying and assessing cybersecurity risks.',
    help_text: 'Explain how you identify threats, vulnerabilities, and assess their potential impact on your operations.',
    question_type: 'textarea',
    category: 'policies',
    subcategory: 'Risk Assessment',
    is_required: true,
    validation_rules: { minLength: 100, maxLength: 3000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['risk identification', 'threat assessment', 'vulnerability assessment', 'impact analysis', 'risk register'],
    ai_confidence_threshold: 0.5,
  },
  // Policies
  {
    question_text: 'Do you have documented information security policies covering all critical areas?',
    help_text: 'This includes acceptable use, access control, data classification, incident response, etc.',
    question_type: 'boolean',
    category: 'policies',
    subcategory: 'Security Policies',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['security policy', 'information security policy', 'acceptable use', 'data classification'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently are your security policies reviewed and updated?',
    help_text: 'Policies should be reviewed regularly and updated based on changes in the threat landscape.',
    question_type: 'select',
    category: 'policies',
    subcategory: 'Security Policies',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'biennially', label: 'Every 2 years', description: 'Biennial review' },
      { value: 'as_needed', label: 'As needed only', description: 'No regular schedule' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['policy review', 'policy update', 'annual review', 'policy revision'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(b): INCIDENT HANDLING
// ============================================================================

const INCIDENT_HANDLING_QUESTIONS: DefaultQuestion[] = [
  // Incident Response Plan
  {
    question_text: 'Do you have a documented incident response plan?',
    help_text: 'NIS2 requires organizations to have procedures for handling security incidents. The plan should cover detection, containment, eradication, recovery, and lessons learned.',
    question_type: 'boolean',
    category: 'incident_handling',
    subcategory: 'Incident Response Plan',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['incident response', 'incident management', 'IRP', 'incident handling', 'security incident'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently do you test your incident response plan?',
    help_text: 'Regular testing ensures your team is prepared to respond effectively to real incidents.',
    question_type: 'select',
    category: 'incident_handling',
    subcategory: 'Incident Response Plan',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Tabletop or simulation every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Tests every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Annual exercises' },
      { value: 'after_incidents', label: 'After major incidents', description: 'Post-incident reviews only' },
      { value: 'never', label: 'Not tested', description: 'No formal testing' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['incident drill', 'tabletop exercise', 'IR test', 'simulation', 'incident response test'],
    ai_confidence_threshold: 0.6,
  },
  // Notification
  {
    question_text: 'What is your target incident notification time to affected clients?',
    help_text: 'NIS2 requires notification to authorities within 24 hours for significant incidents, with a detailed report within 72 hours.',
    question_type: 'select',
    category: 'incident_handling',
    subcategory: 'Incident Notification',
    is_required: true,
    options: [
      { value: 'within_1_hour', label: 'Within 1 hour', description: 'Immediate notification for critical incidents' },
      { value: 'within_4_hours', label: 'Within 4 hours', description: 'Same-day notification' },
      { value: 'within_24_hours', label: 'Within 24 hours', description: 'NIS2 initial notification requirement' },
      { value: 'within_72_hours', label: 'Within 72 hours', description: 'NIS2 detailed report requirement' },
      { value: 'variable', label: 'Varies by severity', description: 'Severity-based timeline' },
      { value: 'not_defined', label: 'Not defined', description: 'No formal timeline' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['notification', 'incident notification', 'response time', '24 hours', '72 hours', 'alert'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Will you commit to notifying us within 24 hours of any security incident affecting our data or services?',
    help_text: 'NIS2 compliance requires timely notification of incidents affecting customers.',
    question_type: 'boolean',
    category: 'incident_handling',
    subcategory: 'Incident Notification',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['24 hour notification', 'breach notification', 'incident alert', 'customer notification'],
    ai_confidence_threshold: 0.7,
  },
  // Detection & Monitoring
  {
    question_text: 'Do you have a dedicated security operations center (SOC) or equivalent?',
    help_text: 'A SOC provides continuous security monitoring and incident response capabilities.',
    question_type: 'select',
    category: 'incident_handling',
    subcategory: 'Detection & Monitoring',
    is_required: true,
    options: [
      { value: 'internal_24_7', label: 'Internal SOC (24/7)', description: 'Round-the-clock internal monitoring' },
      { value: 'internal_business_hours', label: 'Internal SOC (business hours)', description: 'Monitoring during work hours' },
      { value: 'outsourced_24_7', label: 'Outsourced SOC (24/7)', description: 'Managed SOC service' },
      { value: 'hybrid', label: 'Hybrid (internal + outsourced)', description: 'Combined approach' },
      { value: 'no_soc', label: 'No dedicated SOC', description: 'Ad-hoc monitoring only' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['SOC', 'security operations', 'monitoring', '24/7', 'SIEM', 'managed security'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What security monitoring tools do you use?',
    help_text: 'Select all monitoring technologies deployed in your environment.',
    question_type: 'multiselect',
    category: 'incident_handling',
    subcategory: 'Detection & Monitoring',
    is_required: true,
    options: [
      { value: 'siem', label: 'SIEM', description: 'Security Information and Event Management' },
      { value: 'edr', label: 'EDR/XDR', description: 'Endpoint Detection and Response' },
      { value: 'ids_ips', label: 'IDS/IPS', description: 'Intrusion Detection/Prevention Systems' },
      { value: 'ndr', label: 'NDR', description: 'Network Detection and Response' },
      { value: 'soar', label: 'SOAR', description: 'Security Orchestration and Response' },
      { value: 'threat_intel', label: 'Threat Intelligence Platform', description: 'TIP for threat feeds' },
      { value: 'dlp', label: 'DLP', description: 'Data Loss Prevention' },
      { value: 'ueba', label: 'UEBA', description: 'User and Entity Behavior Analytics' },
      { value: 'none', label: 'No dedicated tools', description: 'Basic logging only' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['SIEM', 'EDR', 'IDS', 'monitoring', 'detection', 'Splunk', 'CrowdStrike', 'Sentinel'],
    ai_confidence_threshold: 0.6,
  },
  // Classification
  {
    question_text: 'Describe your incident classification and escalation procedures.',
    help_text: 'How do you classify incident severity (Critical/High/Medium/Low) and escalate to appropriate teams and management?',
    question_type: 'textarea',
    category: 'incident_handling',
    subcategory: 'Classification & Escalation',
    is_required: true,
    validation_rules: { minLength: 100, maxLength: 2500 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['classification', 'escalation', 'severity', 'triage', 'critical', 'high', 'medium', 'low'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you conduct post-incident reviews and implement lessons learned?',
    help_text: 'Continuous improvement requires analyzing incidents and updating procedures accordingly.',
    question_type: 'select',
    category: 'incident_handling',
    subcategory: 'Continuous Improvement',
    is_required: true,
    options: [
      { value: 'always', label: 'Yes, for all incidents', description: 'Comprehensive post-incident reviews' },
      { value: 'major_only', label: 'Yes, for major incidents only', description: 'Reviews for significant incidents' },
      { value: 'sometimes', label: 'Sometimes', description: 'Inconsistent process' },
      { value: 'no', label: 'No formal process', description: 'No post-incident reviews' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['post-incident', 'lessons learned', 'root cause analysis', 'RCA', 'improvement'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(c): BUSINESS CONTINUITY & DISASTER RECOVERY
// ============================================================================

const BUSINESS_CONTINUITY_QUESTIONS: DefaultQuestion[] = [
  // BCP
  {
    question_text: 'Do you have a documented Business Continuity Plan (BCP)?',
    help_text: 'A BCP ensures critical business functions continue during and after disasters or disruptions.',
    question_type: 'boolean',
    category: 'business_continuity',
    subcategory: 'Business Continuity Plan',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['business continuity', 'BCP', 'continuity plan', 'business resilience'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Does your BCP cover cyber-specific scenarios?',
    help_text: 'NIS2 emphasizes all-hazards approach including cyber incidents like ransomware, DDoS, and data breaches.',
    question_type: 'select',
    category: 'business_continuity',
    subcategory: 'Business Continuity Plan',
    is_required: true,
    options: [
      { value: 'comprehensive', label: 'Yes, comprehensive cyber scenarios', description: 'Ransomware, DDoS, breaches, etc.' },
      { value: 'basic', label: 'Yes, basic cyber scenarios', description: 'Some cyber scenarios covered' },
      { value: 'general_only', label: 'General BCP only', description: 'Traditional disasters only' },
      { value: 'no_bcp', label: 'No BCP', description: 'No business continuity plan' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['ransomware', 'cyber attack', 'DDoS', 'data breach', 'cyber scenario', 'cyber incident'],
    ai_confidence_threshold: 0.6,
  },
  // DR
  {
    question_text: 'Do you have a documented Disaster Recovery Plan (DRP)?',
    help_text: 'A DRP outlines procedures to recover IT systems and data after a disaster.',
    question_type: 'boolean',
    category: 'business_continuity',
    subcategory: 'Disaster Recovery',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['disaster recovery', 'DRP', 'DR plan', 'recovery plan', 'IT recovery'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What is your Recovery Time Objective (RTO) for critical systems?',
    help_text: 'RTO is the maximum acceptable time to restore a system after a disruption.',
    question_type: 'select',
    category: 'business_continuity',
    subcategory: 'Recovery Objectives',
    is_required: true,
    options: [
      { value: 'under_1_hour', label: 'Less than 1 hour', description: 'Near-real-time recovery' },
      { value: '1_4_hours', label: '1-4 hours', description: 'Rapid recovery' },
      { value: '4_24_hours', label: '4-24 hours', description: 'Same-day recovery' },
      { value: '24_72_hours', label: '24-72 hours', description: 'Multi-day recovery' },
      { value: 'over_72_hours', label: 'Over 72 hours', description: 'Extended recovery' },
      { value: 'not_defined', label: 'Not defined', description: 'No formal RTO' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['RTO', 'recovery time', 'restore', 'downtime', 'recovery objective'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What is your Recovery Point Objective (RPO) for critical data?',
    help_text: 'RPO is the maximum acceptable data loss measured in time (e.g., 1 hour RPO means max 1 hour of data loss).',
    question_type: 'select',
    category: 'business_continuity',
    subcategory: 'Recovery Objectives',
    is_required: true,
    options: [
      { value: 'zero', label: 'Zero data loss', description: 'Synchronous replication' },
      { value: 'under_1_hour', label: 'Less than 1 hour', description: 'Near-continuous backup' },
      { value: '1_4_hours', label: '1-4 hours', description: 'Frequent backups' },
      { value: '4_24_hours', label: '4-24 hours', description: 'Daily backups' },
      { value: 'over_24_hours', label: 'Over 24 hours', description: 'Infrequent backups' },
      { value: 'not_defined', label: 'Not defined', description: 'No formal RPO' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['RPO', 'recovery point', 'data loss', 'backup frequency', 'replication'],
    ai_confidence_threshold: 0.6,
  },
  // Backup
  {
    question_text: 'Describe your backup strategy and procedures.',
    help_text: 'Include backup frequency, types (full/incremental), retention periods, and geographic redundancy.',
    question_type: 'textarea',
    category: 'business_continuity',
    subcategory: 'Backup Management',
    is_required: true,
    validation_rules: { minLength: 100, maxLength: 2500 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['backup', 'incremental', 'full backup', 'retention', 'offsite', 'redundancy'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you maintain offline or air-gapped backups?',
    help_text: 'Offline backups protect against ransomware that targets connected backup systems.',
    question_type: 'select',
    category: 'business_continuity',
    subcategory: 'Backup Management',
    is_required: true,
    options: [
      { value: 'yes_regular', label: 'Yes, regularly maintained', description: 'Scheduled offline backups' },
      { value: 'yes_critical', label: 'Yes, for critical data only', description: 'Selective offline backup' },
      { value: 'immutable', label: 'Immutable cloud backups', description: 'WORM storage/immutable snapshots' },
      { value: 'no', label: 'No offline backups', description: 'Online backups only' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['offline backup', 'air-gapped', 'immutable', 'WORM', 'tape backup', 'cold storage'],
    ai_confidence_threshold: 0.6,
  },
  // Testing
  {
    question_text: 'How frequently do you test your disaster recovery procedures?',
    help_text: 'Regular testing ensures DR plans work when needed and staff are familiar with procedures.',
    question_type: 'select',
    category: 'business_continuity',
    subcategory: 'Testing',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Tests every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Tests every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Annual DR test' },
      { value: 'after_changes', label: 'After significant changes', description: 'Change-triggered testing' },
      { value: 'never', label: 'Not tested', description: 'No formal DR testing' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['DR test', 'disaster recovery test', 'BCP test', 'failover test', 'recovery drill'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'When was your last successful disaster recovery test?',
    help_text: 'Provide the date and scope of your most recent DR test.',
    question_type: 'date',
    category: 'business_continuity',
    subcategory: 'Testing',
    is_required: false,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['last test', 'DR test date', 'recovery test', 'test completed'],
    ai_confidence_threshold: 0.5,
  },
  // Crisis Management
  {
    question_text: 'Do you have a crisis management team and communication plan?',
    help_text: 'Crisis management ensures coordinated response during major incidents affecting business operations.',
    question_type: 'boolean',
    category: 'business_continuity',
    subcategory: 'Crisis Management',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['crisis management', 'crisis team', 'crisis communication', 'emergency response'],
    ai_confidence_threshold: 0.7,
  },
];

// ============================================================================
// ARTICLE 21(2)(d): SUPPLY CHAIN SECURITY
// ============================================================================

const SUPPLY_CHAIN_QUESTIONS: DefaultQuestion[] = [
  // Vendor Registry
  {
    question_text: 'Do you maintain a register of your critical ICT third-party providers?',
    help_text: 'NIS2 requires organizations to manage supply chain risks by knowing their critical dependencies.',
    question_type: 'boolean',
    category: 'supply_chain',
    subcategory: 'Vendor Registry',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['third party', 'vendor register', 'supplier list', 'vendor inventory', 'critical suppliers'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How many critical/high-risk vendors do you currently manage?',
    help_text: 'Critical vendors are those whose failure would significantly impact your operations.',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Vendor Registry',
    is_required: true,
    options: [
      { value: '1_10', label: '1-10 vendors', description: 'Small vendor portfolio' },
      { value: '11_50', label: '11-50 vendors', description: 'Medium vendor portfolio' },
      { value: '51_100', label: '51-100 vendors', description: 'Large vendor portfolio' },
      { value: 'over_100', label: 'Over 100 vendors', description: 'Enterprise vendor portfolio' },
      { value: 'unknown', label: 'Unknown', description: 'No clear visibility' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['critical vendors', 'number of suppliers', 'vendor count', 'third party count'],
    ai_confidence_threshold: 0.5,
  },
  // Assessment
  {
    question_text: 'Do you conduct security assessments of your third-party vendors?',
    help_text: 'Security assessments help identify risks introduced by vendors and ensure they meet your security standards.',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Vendor Assessment',
    is_required: true,
    options: [
      { value: 'all_vendors', label: 'Yes, all vendors assessed', description: 'Comprehensive vendor assessment' },
      { value: 'critical_only', label: 'Yes, critical vendors only', description: 'Risk-based assessment' },
      { value: 'onboarding_only', label: 'At onboarding only', description: 'Initial assessment only' },
      { value: 'no', label: 'No formal assessment', description: 'No vendor security assessments' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['vendor assessment', 'supplier evaluation', 'third party risk', 'security questionnaire', 'due diligence'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you reassess existing vendor security?',
    help_text: 'Ongoing monitoring ensures vendors maintain their security posture over time.',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Vendor Assessment',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous monitoring', description: 'Real-time or near-real-time' },
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'at_renewal', label: 'At contract renewal', description: 'Renewal-triggered review' },
      { value: 'never', label: 'No ongoing assessment', description: 'One-time assessment only' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['vendor review', 'ongoing assessment', 'continuous monitoring', 'periodic review'],
    ai_confidence_threshold: 0.6,
  },
  // Fourth Party
  {
    question_text: 'Do you assess the security posture of your subcontractors (4th parties)?',
    help_text: 'Understanding 4th party risks is critical as 97% of organizations experienced fourth-party breaches (Gartner).',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Fourth Party Risk',
    is_required: true,
    options: [
      { value: 'yes_all', label: 'Yes, all subcontractors', description: 'Full 4th party visibility' },
      { value: 'yes_critical', label: 'Yes, critical subcontractors', description: 'Risk-based approach' },
      { value: 'contractual', label: 'Contractual requirements only', description: 'Flow-down clauses' },
      { value: 'no', label: 'No assessment performed', description: 'No 4th party visibility' },
      { value: 'no_subcontractors', label: 'No subcontractors used', description: 'No 4th party dependencies' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['subcontractor', 'subservice', 'fourth party', '4th party', 'sub-processor', 'supply chain'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'List your critical subcontractors/subservice organizations.',
    help_text: 'Include cloud providers (AWS, Azure, GCP), data centers, and any party with access to client data.',
    question_type: 'textarea',
    category: 'supply_chain',
    subcategory: 'Fourth Party Risk',
    is_required: true,
    validation_rules: { maxLength: 3000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['subservice organization', 'AWS', 'Azure', 'Google Cloud', 'GCP', 'data center', 'subcontractor'],
    ai_confidence_threshold: 0.5,
  },
  // Contractual
  {
    question_text: 'Do your vendor contracts include security requirements?',
    help_text: 'Contracts should include cybersecurity obligations, incident notification, and audit rights.',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Contractual Requirements',
    is_required: true,
    options: [
      { value: 'comprehensive', label: 'Yes, comprehensive security clauses', description: 'Full security requirements' },
      { value: 'standard', label: 'Yes, standard security clauses', description: 'Basic security requirements' },
      { value: 'some', label: 'Some contracts only', description: 'Inconsistent coverage' },
      { value: 'no', label: 'No security requirements', description: 'No contractual security' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['security clause', 'contract requirements', 'vendor agreement', 'SLA', 'data processing'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Will you agree to contractual terms enforcing NIS2 compliance?',
    help_text: 'This includes breach notification timelines, audit rights, and compliance clauses.',
    question_type: 'boolean',
    category: 'supply_chain',
    subcategory: 'Contractual Requirements',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['NIS2 compliance', 'contractual', 'audit rights', 'compliance clause'],
    ai_confidence_threshold: 0.7,
  },
  // Concentration Risk
  {
    question_text: 'Have you identified concentration risks in your supply chain?',
    help_text: 'Concentration risk occurs when multiple critical services depend on the same vendor or technology.',
    question_type: 'select',
    category: 'supply_chain',
    subcategory: 'Concentration Risk',
    is_required: true,
    options: [
      { value: 'yes_mitigated', label: 'Yes, identified and mitigated', description: 'Active concentration management' },
      { value: 'yes_identified', label: 'Yes, identified but not mitigated', description: 'Known but unaddressed' },
      { value: 'partial', label: 'Partially assessed', description: 'Incomplete analysis' },
      { value: 'no', label: 'No assessment performed', description: 'Unknown concentration risks' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['concentration risk', 'single point', 'dependency', 'vendor lock-in', 'diversification'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(e): VULNERABILITY MANAGEMENT
// ============================================================================

const VULNERABILITY_MANAGEMENT_QUESTIONS: DefaultQuestion[] = [
  // Scanning
  {
    question_text: 'How frequently do you perform vulnerability scanning?',
    help_text: 'Regular scanning helps identify and remediate security weaknesses before exploitation.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Vulnerability Scanning',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous / Real-time', description: 'Automated continuous scanning' },
      { value: 'weekly', label: 'Weekly', description: 'Scans every week' },
      { value: 'monthly', label: 'Monthly', description: 'Scans every month' },
      { value: 'quarterly', label: 'Quarterly', description: 'Scans every 3 months' },
      { value: 'annually', label: 'Annually', description: 'Annual scans only' },
      { value: 'never', label: 'Not performed', description: 'No vulnerability scanning' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['vulnerability scan', 'scanning', 'Nessus', 'Qualys', 'vulnerability assessment'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What types of vulnerability scanning do you perform?',
    help_text: 'Select all scanning types used in your environment.',
    question_type: 'multiselect',
    category: 'vulnerability_management',
    subcategory: 'Vulnerability Scanning',
    is_required: true,
    options: [
      { value: 'network', label: 'Network vulnerability scanning', description: 'Internal and external network scans' },
      { value: 'web_app', label: 'Web application scanning', description: 'DAST for web applications' },
      { value: 'container', label: 'Container/image scanning', description: 'Docker/Kubernetes security' },
      { value: 'code', label: 'Static code analysis (SAST)', description: 'Source code security review' },
      { value: 'dependency', label: 'Dependency/SCA scanning', description: 'Third-party library vulnerabilities' },
      { value: 'cloud', label: 'Cloud configuration scanning', description: 'Cloud security posture management' },
      { value: 'none', label: 'None performed', description: 'No scanning implemented' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['SAST', 'DAST', 'SCA', 'container scan', 'code review', 'CSPM'],
    ai_confidence_threshold: 0.6,
  },
  // Penetration Testing
  {
    question_text: 'How frequently do you conduct penetration testing?',
    help_text: 'Penetration tests simulate real attacks to identify vulnerabilities that automated tools may miss.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Penetration Testing',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Tests every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Tests every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Annual penetration test' },
      { value: 'after_changes', label: 'After significant changes', description: 'Change-triggered testing' },
      { value: 'never', label: 'Not performed', description: 'No penetration testing' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['penetration test', 'pentest', 'ethical hacking', 'red team', 'security assessment'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'When was your last penetration test conducted?',
    help_text: 'Provide the date of your most recent external or internal penetration test.',
    question_type: 'date',
    category: 'vulnerability_management',
    subcategory: 'Penetration Testing',
    is_required: false,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['pentest date', 'last penetration', 'security test', 'assessment date'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Are your penetration tests conducted by external/independent parties?',
    help_text: 'Independent testing provides objective assessment free from internal bias.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Penetration Testing',
    is_required: true,
    options: [
      { value: 'external_only', label: 'External only', description: 'Independent third-party testers' },
      { value: 'both', label: 'Both internal and external', description: 'Combination approach' },
      { value: 'internal_only', label: 'Internal only', description: 'Internal security team' },
      { value: 'no_pentests', label: 'No pentests performed', description: 'No penetration testing' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['external pentest', 'independent', 'third party', 'internal team'],
    ai_confidence_threshold: 0.6,
  },
  // Patch Management
  {
    question_text: 'What is your target remediation time for critical vulnerabilities?',
    help_text: 'NIS2 expects timely patching as part of basic cyber hygiene. Critical vulnerabilities should be addressed urgently.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Patch Management',
    is_required: true,
    options: [
      { value: 'within_24_hours', label: 'Within 24 hours', description: 'Emergency patching' },
      { value: 'within_72_hours', label: 'Within 72 hours', description: 'Urgent patching' },
      { value: 'within_7_days', label: 'Within 7 days', description: 'Priority patching' },
      { value: 'within_30_days', label: 'Within 30 days', description: 'Standard patching' },
      { value: 'within_90_days', label: 'Within 90 days', description: 'Extended timeline' },
      { value: 'not_defined', label: 'Not defined', description: 'No formal SLA' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['remediation', 'patch', 'SLA', 'critical', 'vulnerability', 'fix time'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Describe your patch management process.',
    help_text: 'How do you identify, prioritize, test, and deploy security patches across your environment?',
    question_type: 'textarea',
    category: 'vulnerability_management',
    subcategory: 'Patch Management',
    is_required: true,
    validation_rules: { minLength: 100, maxLength: 2500 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['patch management', 'patching', 'update', 'security patch', 'WSUS', 'patch cycle'],
    ai_confidence_threshold: 0.5,
  },
  // Secure Development
  {
    question_text: 'Do you follow a secure software development lifecycle (SDLC)?',
    help_text: 'Secure SDLC integrates security practices throughout the development process.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Secure Development',
    is_required: true,
    options: [
      { value: 'formal_sdlc', label: 'Yes, formal secure SDLC', description: 'Documented security gates' },
      { value: 'devsecops', label: 'Yes, DevSecOps practices', description: 'Security integrated in CI/CD' },
      { value: 'some_practices', label: 'Some security practices', description: 'Partial implementation' },
      { value: 'no', label: 'No formal process', description: 'No secure development practices' },
      { value: 'not_applicable', label: 'N/A - No development', description: 'No software development' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['SDLC', 'secure development', 'DevSecOps', 'security review', 'code review'],
    ai_confidence_threshold: 0.6,
  },
  // Vulnerability Disclosure
  {
    question_text: 'Do you have a vulnerability disclosure policy?',
    help_text: 'A responsible disclosure policy allows external researchers to report vulnerabilities safely.',
    question_type: 'select',
    category: 'vulnerability_management',
    subcategory: 'Vulnerability Disclosure',
    is_required: true,
    options: [
      { value: 'public_vdp', label: 'Yes, public VDP', description: 'Published vulnerability disclosure policy' },
      { value: 'bug_bounty', label: 'Yes, bug bounty program', description: 'Paid vulnerability research program' },
      { value: 'private_channel', label: 'Private reporting channel', description: 'Security contact/email' },
      { value: 'no', label: 'No disclosure process', description: 'No formal process' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['VDP', 'vulnerability disclosure', 'bug bounty', 'responsible disclosure', 'security.txt'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(f): EFFECTIVENESS ASSESSMENT
// ============================================================================

const EFFECTIVENESS_ASSESSMENT_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you have policies and procedures to assess the effectiveness of your cybersecurity measures?',
    help_text: 'NIS2 Article 21(2)(f) requires organizations to regularly evaluate their security controls.',
    question_type: 'boolean',
    category: 'effectiveness_assessment',
    subcategory: 'Assessment Program',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['effectiveness', 'assessment', 'evaluation', 'security metrics', 'KPI'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently do you assess the effectiveness of security controls?',
    help_text: 'Regular assessment ensures controls remain effective against evolving threats.',
    question_type: 'select',
    category: 'effectiveness_assessment',
    subcategory: 'Assessment Program',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous monitoring', description: 'Real-time metrics and dashboards' },
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Annual review' },
      { value: 'never', label: 'No formal assessment', description: 'Ad-hoc only' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['control assessment', 'security review', 'effectiveness review', 'periodic review'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you track security metrics and Key Performance Indicators (KPIs)?',
    help_text: 'Metrics help measure security program effectiveness and identify areas for improvement.',
    question_type: 'select',
    category: 'effectiveness_assessment',
    subcategory: 'Metrics & KPIs',
    is_required: true,
    options: [
      { value: 'comprehensive', label: 'Yes, comprehensive metrics program', description: 'Full security metrics tracking' },
      { value: 'basic', label: 'Yes, basic metrics', description: 'Key metrics tracked' },
      { value: 'developing', label: 'Developing metrics program', description: 'In progress' },
      { value: 'no', label: 'No metrics tracking', description: 'No formal metrics' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['KPI', 'metrics', 'measurement', 'dashboard', 'reporting'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What security metrics do you track?',
    help_text: 'Select all metrics that your organization tracks and reports.',
    question_type: 'multiselect',
    category: 'effectiveness_assessment',
    subcategory: 'Metrics & KPIs',
    is_required: false,
    options: [
      { value: 'vulnerability_metrics', label: 'Vulnerability metrics', description: 'Open vulns, MTTR, age' },
      { value: 'incident_metrics', label: 'Incident metrics', description: 'MTTD, MTTR, volume' },
      { value: 'compliance_metrics', label: 'Compliance metrics', description: 'Control coverage, exceptions' },
      { value: 'training_metrics', label: 'Training metrics', description: 'Completion rates, phishing results' },
      { value: 'patch_metrics', label: 'Patch metrics', description: 'Patch compliance, age' },
      { value: 'access_metrics', label: 'Access metrics', description: 'Access reviews, orphan accounts' },
      { value: 'risk_metrics', label: 'Risk metrics', description: 'Risk scores, treatment status' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['MTTD', 'MTTR', 'vulnerability age', 'patch compliance', 'risk score'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you conduct internal security audits?',
    help_text: 'Internal audits verify that security controls are implemented and operating effectively.',
    question_type: 'select',
    category: 'effectiveness_assessment',
    subcategory: 'Audits',
    is_required: true,
    options: [
      { value: 'dedicated_team', label: 'Yes, dedicated internal audit team', description: 'Full-time audit function' },
      { value: 'periodic', label: 'Yes, periodic internal audits', description: 'Scheduled audits' },
      { value: 'external_only', label: 'External audits only', description: 'No internal audit capability' },
      { value: 'no', label: 'No audits performed', description: 'No audit function' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['internal audit', 'security audit', 'audit program', 'audit team'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you have a continuous improvement process for cybersecurity?',
    help_text: 'Continuous improvement ensures security measures evolve with changing threats.',
    question_type: 'boolean',
    category: 'effectiveness_assessment',
    subcategory: 'Continuous Improvement',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['continuous improvement', 'PDCA', 'improvement plan', 'maturity'],
    ai_confidence_threshold: 0.7,
  },
];

// ============================================================================
// ARTICLE 21(2)(g): CYBER HYGIENE & TRAINING
// ============================================================================

const SECURITY_AWARENESS_QUESTIONS: DefaultQuestion[] = [
  // Training Program
  {
    question_text: 'Do you provide security awareness training to all employees?',
    help_text: 'NIS2 requires appropriate cyber hygiene practices and cybersecurity training for all staff.',
    question_type: 'boolean',
    category: 'security_awareness',
    subcategory: 'Training Program',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['security training', 'awareness', 'training program', 'cyber hygiene', 'security education'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently is security awareness training conducted?',
    help_text: 'Regular training keeps employees aware of current threats and security practices.',
    question_type: 'select',
    category: 'security_awareness',
    subcategory: 'Training Program',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous/Ongoing', description: 'Regular micro-learning modules' },
      { value: 'quarterly', label: 'Quarterly', description: 'Training every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Training every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'onboarding_only', label: 'At onboarding only', description: 'New hire training only' },
      { value: 'never', label: 'Not provided', description: 'No training program' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['training frequency', 'annual training', 'security awareness', 'training schedule'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What topics does your security awareness training cover?',
    help_text: 'Select all topics included in your security training curriculum.',
    question_type: 'multiselect',
    category: 'security_awareness',
    subcategory: 'Training Content',
    is_required: true,
    options: [
      { value: 'phishing', label: 'Phishing awareness', description: 'Email and social engineering' },
      { value: 'password', label: 'Password security', description: 'Strong passwords and MFA' },
      { value: 'data_handling', label: 'Data handling', description: 'Classification and protection' },
      { value: 'physical', label: 'Physical security', description: 'Clean desk, visitor policy' },
      { value: 'remote_work', label: 'Remote work security', description: 'Home office best practices' },
      { value: 'social_engineering', label: 'Social engineering', description: 'Manipulation techniques' },
      { value: 'incident_reporting', label: 'Incident reporting', description: 'How to report security issues' },
      { value: 'compliance', label: 'Compliance requirements', description: 'NIS2, GDPR, etc.' },
      { value: 'mobile', label: 'Mobile device security', description: 'BYOD and mobile threats' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['phishing', 'social engineering', 'password', 'data handling', 'training topics'],
    ai_confidence_threshold: 0.5,
  },
  // Phishing
  {
    question_text: 'Do you conduct phishing simulations?',
    help_text: 'Phishing simulations test employee awareness and reinforce training.',
    question_type: 'select',
    category: 'security_awareness',
    subcategory: 'Phishing Simulations',
    is_required: true,
    options: [
      { value: 'monthly', label: 'Monthly', description: 'Regular monthly simulations' },
      { value: 'quarterly', label: 'Quarterly', description: 'Simulations every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Twice per year' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'no', label: 'Not conducted', description: 'No phishing tests' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['phishing simulation', 'phishing test', 'social engineering test', 'awareness test'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What is your average phishing simulation click rate?',
    help_text: 'The percentage of employees who click on simulated phishing links.',
    question_type: 'select',
    category: 'security_awareness',
    subcategory: 'Phishing Simulations',
    is_required: false,
    options: [
      { value: 'under_5', label: 'Under 5%', description: 'Excellent awareness' },
      { value: '5_10', label: '5-10%', description: 'Good awareness' },
      { value: '10_20', label: '10-20%', description: 'Average awareness' },
      { value: 'over_20', label: 'Over 20%', description: 'Needs improvement' },
      { value: 'unknown', label: 'Unknown/Not tracked', description: 'No data available' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['click rate', 'phishing rate', 'failure rate', 'awareness metrics'],
    ai_confidence_threshold: 0.5,
  },
  // Role-based Training
  {
    question_text: 'Do you provide role-based security training for technical staff?',
    help_text: 'Technical roles (developers, admins, security staff) require specialized security training.',
    question_type: 'select',
    category: 'security_awareness',
    subcategory: 'Role-Based Training',
    is_required: true,
    options: [
      { value: 'comprehensive', label: 'Yes, comprehensive role-based training', description: 'Full technical curriculum' },
      { value: 'some_roles', label: 'Yes, for some roles', description: 'Selective role-based training' },
      { value: 'general_only', label: 'General training only', description: 'Same training for all' },
      { value: 'no', label: 'No training provided', description: 'No security training' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['role-based', 'technical training', 'developer training', 'admin training'],
    ai_confidence_threshold: 0.6,
  },
  // Cyber Hygiene
  {
    question_text: 'Do you enforce basic cyber hygiene practices?',
    help_text: 'Cyber hygiene includes password policies, software updates, antivirus, and secure configurations.',
    question_type: 'boolean',
    category: 'security_awareness',
    subcategory: 'Cyber Hygiene',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['cyber hygiene', 'security practices', 'baseline security', 'security standards'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you have endpoint protection deployed on all devices?',
    help_text: 'Endpoint protection (antivirus, EDR) is a fundamental cyber hygiene requirement.',
    question_type: 'select',
    category: 'security_awareness',
    subcategory: 'Cyber Hygiene',
    is_required: true,
    options: [
      { value: 'all_managed', label: 'Yes, all managed devices', description: 'Full endpoint coverage' },
      { value: 'most_devices', label: 'Yes, most devices (>90%)', description: 'Near-complete coverage' },
      { value: 'some_devices', label: 'Partial coverage', description: 'Some devices protected' },
      { value: 'no', label: 'No endpoint protection', description: 'No protection deployed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['endpoint protection', 'antivirus', 'EDR', 'endpoint security', 'malware protection'],
    ai_confidence_threshold: 0.7,
  },
];

// ============================================================================
// ARTICLE 21(2)(h): CRYPTOGRAPHY & ENCRYPTION
// ============================================================================

const CRYPTOGRAPHY_QUESTIONS: DefaultQuestion[] = [
  // Data at Rest
  {
    question_text: 'Do you encrypt data at rest?',
    help_text: 'Data at rest encryption protects stored data from unauthorized access if storage is compromised.',
    question_type: 'select',
    category: 'cryptography',
    subcategory: 'Data at Rest',
    is_required: true,
    options: [
      { value: 'all_data', label: 'Yes, all data encrypted', description: 'Full disk/database encryption' },
      { value: 'sensitive_only', label: 'Yes, sensitive data only', description: 'Classification-based encryption' },
      { value: 'some_systems', label: 'Some systems only', description: 'Partial encryption' },
      { value: 'no', label: 'No encryption at rest', description: 'Data stored unencrypted' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['encryption at rest', 'AES', 'encrypted storage', 'disk encryption', 'database encryption'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What encryption algorithms do you use for data at rest?',
    help_text: 'Modern encryption should use AES-256 or equivalent strength algorithms.',
    question_type: 'multiselect',
    category: 'cryptography',
    subcategory: 'Data at Rest',
    is_required: false,
    options: [
      { value: 'aes_256', label: 'AES-256', description: 'Industry standard' },
      { value: 'aes_128', label: 'AES-128', description: 'Acceptable strength' },
      { value: 'chacha20', label: 'ChaCha20', description: 'Modern stream cipher' },
      { value: 'rsa', label: 'RSA (for key encryption)', description: 'Asymmetric encryption' },
      { value: 'other', label: 'Other algorithms', description: 'Specify in notes' },
      { value: 'unknown', label: 'Unknown', description: 'Not sure of algorithms used' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['AES', 'AES-256', 'encryption algorithm', 'cryptographic'],
    ai_confidence_threshold: 0.6,
  },
  // Data in Transit
  {
    question_text: 'Do you encrypt data in transit?',
    help_text: 'Data in transit should be protected using TLS 1.2 or higher.',
    question_type: 'select',
    category: 'cryptography',
    subcategory: 'Data in Transit',
    is_required: true,
    options: [
      { value: 'tls_1_3', label: 'Yes, TLS 1.3', description: 'Latest TLS version' },
      { value: 'tls_1_2', label: 'Yes, TLS 1.2', description: 'Minimum acceptable' },
      { value: 'tls_mixed', label: 'Mixed (TLS 1.2 and 1.3)', description: 'Both versions supported' },
      { value: 'older', label: 'Older protocols (TLS 1.1 or below)', description: 'Deprecated protocols' },
      { value: 'no', label: 'No encryption in transit', description: 'Unencrypted transmission' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['TLS', 'encryption in transit', 'HTTPS', 'SSL', 'transport encryption', 'TLS 1.2', 'TLS 1.3'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you use end-to-end encryption for sensitive communications?',
    help_text: 'End-to-end encryption ensures data is encrypted from sender to recipient without intermediary access.',
    question_type: 'select',
    category: 'cryptography',
    subcategory: 'Data in Transit',
    is_required: true,
    options: [
      { value: 'all_comms', label: 'Yes, all sensitive communications', description: 'Full E2E encryption' },
      { value: 'some_comms', label: 'Yes, some communications', description: 'Selective E2E' },
      { value: 'transport_only', label: 'Transport encryption only', description: 'TLS but not E2E' },
      { value: 'no', label: 'No end-to-end encryption', description: 'No E2E implemented' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['end-to-end', 'E2E', 'encrypted communication', 'secure messaging'],
    ai_confidence_threshold: 0.6,
  },
  // Key Management
  {
    question_text: 'How do you manage encryption keys?',
    help_text: 'Describe key management practices including generation, storage, rotation, and destruction.',
    question_type: 'textarea',
    category: 'cryptography',
    subcategory: 'Key Management',
    is_required: true,
    validation_rules: { minLength: 50, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['key management', 'KMS', 'HSM', 'key rotation', 'encryption key', 'key storage'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you use Hardware Security Modules (HSMs) for key protection?',
    help_text: 'HSMs provide tamper-resistant key storage and cryptographic operations.',
    question_type: 'select',
    category: 'cryptography',
    subcategory: 'Key Management',
    is_required: true,
    options: [
      { value: 'dedicated_hsm', label: 'Yes, dedicated HSMs', description: 'Physical or cloud HSM' },
      { value: 'cloud_kms', label: 'Cloud KMS (AWS/Azure/GCP)', description: 'Managed key service' },
      { value: 'software_vault', label: 'Software key vault', description: 'HashiCorp Vault or similar' },
      { value: 'no', label: 'No dedicated key protection', description: 'Keys stored in application' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['HSM', 'Hardware Security Module', 'key vault', 'KMS', 'AWS KMS', 'Azure Key Vault'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you rotate encryption keys?',
    help_text: 'Regular key rotation limits the impact of potential key compromise.',
    question_type: 'select',
    category: 'cryptography',
    subcategory: 'Key Management',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'on_compromise', label: 'Only on suspected compromise', description: 'Event-triggered' },
      { value: 'never', label: 'No rotation policy', description: 'Keys not rotated' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['key rotation', 'rotation policy', 'key lifecycle', 'key expiry'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(i): HR SECURITY, ACCESS CONTROL & ASSET MANAGEMENT
// ============================================================================

const ACCESS_CONTROL_QUESTIONS: DefaultQuestion[] = [
  // Access Control
  {
    question_text: 'Do you follow the principle of least privilege for access control?',
    help_text: 'Users should only have access to resources necessary for their role.',
    question_type: 'boolean',
    category: 'access_control',
    subcategory: 'Access Control Principles',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['least privilege', 'RBAC', 'role-based', 'access control', 'permissions', 'need-to-know'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What access control model do you implement?',
    help_text: 'Select the primary access control model used in your organization.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'Access Control Principles',
    is_required: true,
    options: [
      { value: 'rbac', label: 'Role-Based Access Control (RBAC)', description: 'Access based on job roles' },
      { value: 'abac', label: 'Attribute-Based Access Control (ABAC)', description: 'Policy-based with attributes' },
      { value: 'mac', label: 'Mandatory Access Control (MAC)', description: 'Classification-based' },
      { value: 'dac', label: 'Discretionary Access Control (DAC)', description: 'Owner-controlled' },
      { value: 'zero_trust', label: 'Zero Trust', description: 'Never trust, always verify' },
      { value: 'hybrid', label: 'Hybrid approach', description: 'Combination of models' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['RBAC', 'ABAC', 'access control model', 'zero trust', 'identity management'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you conduct access reviews?',
    help_text: 'Regular reviews ensure access rights remain appropriate as roles change.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'Access Reviews',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous monitoring', description: 'Real-time access analytics' },
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'never', label: 'Not performed', description: 'No access reviews' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['access review', 'user access', 'entitlement review', 'periodic review', 'recertification'],
    ai_confidence_threshold: 0.6,
  },
  // Privileged Access
  {
    question_text: 'Describe your privileged access management (PAM) approach.',
    help_text: 'How do you manage, monitor, and secure privileged/admin accounts?',
    question_type: 'textarea',
    category: 'access_control',
    subcategory: 'Privileged Access',
    is_required: true,
    validation_rules: { minLength: 100, maxLength: 2500 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['PAM', 'privileged access', 'admin', 'elevated', 'superuser', 'root access'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you use a dedicated Privileged Access Management (PAM) solution?',
    help_text: 'PAM solutions provide secure vaulting, session recording, and just-in-time access.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'Privileged Access',
    is_required: true,
    options: [
      { value: 'enterprise_pam', label: 'Yes, enterprise PAM solution', description: 'CyberArk, BeyondTrust, etc.' },
      { value: 'cloud_pam', label: 'Yes, cloud-native PAM', description: 'AWS SSO, Azure PIM, etc.' },
      { value: 'basic_controls', label: 'Basic controls only', description: 'Password vault, no session recording' },
      { value: 'no', label: 'No PAM solution', description: 'Manual privileged access management' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['CyberArk', 'BeyondTrust', 'PAM solution', 'privileged access management'],
    ai_confidence_threshold: 0.6,
  },
  // HR Security
  {
    question_text: 'Do you conduct background checks for employees with privileged access?',
    help_text: 'Background checks help ensure trustworthiness of personnel handling sensitive data.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'HR Security',
    is_required: true,
    options: [
      { value: 'all_employees', label: 'Yes, all employees', description: 'Universal background checks' },
      { value: 'privileged_only', label: 'Yes, privileged roles only', description: 'Risk-based approach' },
      { value: 'some_roles', label: 'Some roles only', description: 'Limited checks' },
      { value: 'no', label: 'No background checks', description: 'No formal process' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['background check', 'screening', 'vetting', 'pre-employment'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you have documented onboarding and offboarding procedures for access management?',
    help_text: 'Clear procedures ensure proper access provisioning and timely revocation.',
    question_type: 'boolean',
    category: 'access_control',
    subcategory: 'HR Security',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['onboarding', 'offboarding', 'joiner mover leaver', 'access provisioning', 'termination'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How quickly is access revoked when an employee leaves?',
    help_text: 'Prompt access revocation prevents unauthorized access by former employees.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'HR Security',
    is_required: true,
    options: [
      { value: 'immediate', label: 'Immediately', description: 'Same-day revocation' },
      { value: 'within_24_hours', label: 'Within 24 hours', description: 'Next business day' },
      { value: 'within_week', label: 'Within 1 week', description: 'Weekly process' },
      { value: 'variable', label: 'Variable', description: 'Depends on circumstances' },
      { value: 'no_process', label: 'No formal process', description: 'Ad-hoc revocation' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['access revocation', 'termination', 'deprovisioning', 'offboarding time'],
    ai_confidence_threshold: 0.6,
  },
  // Asset Management
  {
    question_text: 'Do you maintain a comprehensive inventory of information assets?',
    help_text: 'Asset inventory is essential for protecting what you have and knowing your attack surface.',
    question_type: 'boolean',
    category: 'access_control',
    subcategory: 'Asset Management',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['asset inventory', 'CMDB', 'asset register', 'asset management'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What types of assets are tracked in your inventory?',
    help_text: 'Select all asset types included in your asset management program.',
    question_type: 'multiselect',
    category: 'access_control',
    subcategory: 'Asset Management',
    is_required: true,
    options: [
      { value: 'hardware', label: 'Hardware assets', description: 'Servers, endpoints, network devices' },
      { value: 'software', label: 'Software assets', description: 'Applications, licenses' },
      { value: 'cloud', label: 'Cloud assets', description: 'Cloud resources and services' },
      { value: 'data', label: 'Data assets', description: 'Databases, file shares, data stores' },
      { value: 'network', label: 'Network assets', description: 'IP addresses, domains, certificates' },
      { value: 'mobile', label: 'Mobile devices', description: 'Phones, tablets, BYOD' },
      { value: 'virtual', label: 'Virtual assets', description: 'VMs, containers' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['hardware inventory', 'software inventory', 'cloud assets', 'data assets'],
    ai_confidence_threshold: 0.5,
  },
  {
    question_text: 'Do you classify data based on sensitivity?',
    help_text: 'Data classification enables appropriate protection levels based on sensitivity.',
    question_type: 'select',
    category: 'access_control',
    subcategory: 'Asset Management',
    is_required: true,
    options: [
      { value: 'formal_scheme', label: 'Yes, formal classification scheme', description: 'Public/Internal/Confidential/Restricted' },
      { value: 'basic_scheme', label: 'Yes, basic classification', description: 'Sensitive vs non-sensitive' },
      { value: 'developing', label: 'In development', description: 'Classification program underway' },
      { value: 'no', label: 'No data classification', description: 'Data not classified' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['data classification', 'sensitivity', 'confidential', 'restricted', 'public'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// ARTICLE 21(2)(j): MFA & SECURE COMMUNICATIONS
// ============================================================================

const MFA_SECURE_COMMS_QUESTIONS: DefaultQuestion[] = [
  // MFA
  {
    question_text: 'Do you enforce Multi-Factor Authentication (MFA)?',
    help_text: 'NIS2 requires MFA or continuous authentication solutions where appropriate.',
    question_type: 'select',
    category: 'mfa_secure_comms',
    subcategory: 'Multi-Factor Authentication',
    is_required: true,
    options: [
      { value: 'all_users', label: 'Yes, all users', description: 'Universal MFA requirement' },
      { value: 'privileged_only', label: 'Yes, privileged users only', description: 'Admins and sensitive roles' },
      { value: 'external_only', label: 'Yes, external access only', description: 'VPN and remote access' },
      { value: 'optional', label: 'Optional (user choice)', description: 'MFA available but not required' },
      { value: 'no', label: 'Not implemented', description: 'No MFA deployed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['MFA', 'multi-factor', 'two-factor', '2FA', 'authentication', 'strong authentication'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What MFA methods do you support?',
    help_text: 'Select all authentication factors available to users.',
    question_type: 'multiselect',
    category: 'mfa_secure_comms',
    subcategory: 'Multi-Factor Authentication',
    is_required: true,
    options: [
      { value: 'authenticator_app', label: 'Authenticator app (TOTP)', description: 'Google/Microsoft Authenticator' },
      { value: 'hardware_token', label: 'Hardware tokens', description: 'YubiKey, RSA tokens' },
      { value: 'fido2', label: 'FIDO2/WebAuthn', description: 'Passwordless authentication' },
      { value: 'sms', label: 'SMS OTP', description: 'Text message codes' },
      { value: 'email', label: 'Email OTP', description: 'Email verification codes' },
      { value: 'push', label: 'Push notifications', description: 'Mobile app approval' },
      { value: 'biometric', label: 'Biometrics', description: 'Fingerprint, face recognition' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['authenticator', 'YubiKey', 'FIDO', 'WebAuthn', 'biometric', 'hardware token'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you require phishing-resistant MFA for privileged access?',
    help_text: 'Phishing-resistant methods (FIDO2, hardware tokens) protect against credential theft attacks.',
    question_type: 'select',
    category: 'mfa_secure_comms',
    subcategory: 'Multi-Factor Authentication',
    is_required: true,
    options: [
      { value: 'yes_required', label: 'Yes, required for privileged access', description: 'FIDO2/hardware tokens mandatory' },
      { value: 'yes_recommended', label: 'Yes, recommended but not required', description: 'Encouraged but optional' },
      { value: 'no', label: 'No phishing-resistant requirement', description: 'Any MFA method accepted' },
      { value: 'no_mfa', label: 'No MFA implemented', description: 'MFA not deployed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['phishing-resistant', 'FIDO2', 'passwordless', 'hardware authentication'],
    ai_confidence_threshold: 0.6,
  },
  // Secure Communications
  {
    question_text: 'Do you have secured voice, video, and text communications?',
    help_text: 'NIS2 Article 21(2)(j) specifically requires secured communication systems where appropriate.',
    question_type: 'select',
    category: 'mfa_secure_comms',
    subcategory: 'Secure Communications',
    is_required: true,
    options: [
      { value: 'all_encrypted', label: 'Yes, all communications encrypted', description: 'E2E encryption for all channels' },
      { value: 'enterprise_tools', label: 'Yes, enterprise-grade tools', description: 'Teams, Zoom, Slack with encryption' },
      { value: 'some_channels', label: 'Some channels secured', description: 'Partial encryption' },
      { value: 'no', label: 'No secured communications', description: 'Standard unencrypted tools' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['secure communication', 'encrypted messaging', 'video encryption', 'voice encryption'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What secure communication tools do you use?',
    help_text: 'List the primary tools used for internal and external secure communications.',
    question_type: 'multiselect',
    category: 'mfa_secure_comms',
    subcategory: 'Secure Communications',
    is_required: false,
    options: [
      { value: 'teams', label: 'Microsoft Teams', description: 'Enterprise collaboration' },
      { value: 'slack', label: 'Slack Enterprise', description: 'Enterprise messaging' },
      { value: 'zoom', label: 'Zoom (encrypted)', description: 'Video conferencing' },
      { value: 'signal', label: 'Signal', description: 'E2E encrypted messaging' },
      { value: 'webex', label: 'Cisco Webex', description: 'Enterprise collaboration' },
      { value: 'other_e2e', label: 'Other E2E encrypted tool', description: 'Specify in notes' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['Teams', 'Slack', 'Zoom', 'Signal', 'Webex', 'collaboration tool'],
    ai_confidence_threshold: 0.5,
  },
  // Emergency Communications
  {
    question_text: 'Do you have secured emergency communication systems?',
    help_text: 'NIS2 specifically mentions secured emergency communication systems within the entity.',
    question_type: 'select',
    category: 'mfa_secure_comms',
    subcategory: 'Emergency Communications',
    is_required: true,
    options: [
      { value: 'dedicated_system', label: 'Yes, dedicated emergency system', description: 'Out-of-band crisis communications' },
      { value: 'backup_channels', label: 'Yes, backup communication channels', description: 'Alternative methods available' },
      { value: 'documented_procedures', label: 'Documented procedures only', description: 'No dedicated system' },
      { value: 'no', label: 'No emergency communications plan', description: 'No specific provisions' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['emergency communication', 'crisis communication', 'out-of-band', 'backup communication'],
    ai_confidence_threshold: 0.6,
  },
  // Continuous Authentication
  {
    question_text: 'Do you implement continuous authentication or adaptive access?',
    help_text: 'Continuous authentication monitors user behavior and context to verify identity throughout a session.',
    question_type: 'select',
    category: 'mfa_secure_comms',
    subcategory: 'Continuous Authentication',
    is_required: false,
    options: [
      { value: 'full_implementation', label: 'Yes, fully implemented', description: 'Continuous identity verification' },
      { value: 'risk_based', label: 'Risk-based/adaptive access', description: 'Context-aware authentication' },
      { value: 'session_based', label: 'Session-based only', description: 'Periodic re-authentication' },
      { value: 'no', label: 'Not implemented', description: 'Single authentication per session' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['continuous authentication', 'adaptive', 'risk-based', 'context-aware', 'behavioral'],
    ai_confidence_threshold: 0.6,
  },
];

// ============================================================================
// LEGACY CATEGORIES (for backward compatibility)
// ============================================================================

const ASSET_MANAGEMENT_QUESTIONS: DefaultQuestion[] = [
  // These mirror the Asset Management questions from access_control
  {
    question_text: 'Do you maintain a comprehensive inventory of all IT assets?',
    help_text: 'Asset inventory helps identify what needs protection and the potential attack surface.',
    question_type: 'boolean',
    category: 'asset_management',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['asset inventory', 'CMDB', 'asset register', 'asset management'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently is your asset inventory updated?',
    help_text: 'Regular updates ensure the inventory reflects current assets.',
    question_type: 'select',
    category: 'asset_management',
    is_required: true,
    options: [
      { value: 'real_time', label: 'Real-time/Automated', description: 'Continuous discovery' },
      { value: 'weekly', label: 'Weekly', description: 'Weekly updates' },
      { value: 'monthly', label: 'Monthly', description: 'Monthly updates' },
      { value: 'quarterly', label: 'Quarterly', description: 'Quarterly updates' },
      { value: 'annually', label: 'Annually', description: 'Annual inventory' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['inventory update', 'asset discovery', 'CMDB update'],
    ai_confidence_threshold: 0.6,
  },
];

const HR_SECURITY_QUESTIONS: DefaultQuestion[] = [
  // These mirror the HR Security questions from access_control
  {
    question_text: 'Do all employees sign confidentiality/NDA agreements?',
    help_text: 'Legal agreements establish security responsibilities for employees.',
    question_type: 'boolean',
    category: 'hr_security',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['NDA', 'confidentiality', 'non-disclosure', 'employment agreement'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you have disciplinary procedures for security policy violations?',
    help_text: 'Clear consequences help enforce security policies.',
    question_type: 'boolean',
    category: 'hr_security',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['disciplinary', 'violation', 'enforcement', 'sanctions'],
    ai_confidence_threshold: 0.7,
  },
];

// ============================================================================
// EXPORTED LIBRARY
// ============================================================================

/**
 * All default questions organized by category
 */
export const DEFAULT_QUESTIONS: Record<NIS2Category, DefaultQuestion[]> = {
  policies: POLICIES_QUESTIONS,
  incident_handling: INCIDENT_HANDLING_QUESTIONS,
  business_continuity: BUSINESS_CONTINUITY_QUESTIONS,
  supply_chain: SUPPLY_CHAIN_QUESTIONS,
  vulnerability_management: VULNERABILITY_MANAGEMENT_QUESTIONS,
  effectiveness_assessment: EFFECTIVENESS_ASSESSMENT_QUESTIONS,
  security_awareness: SECURITY_AWARENESS_QUESTIONS,
  cryptography: CRYPTOGRAPHY_QUESTIONS,
  access_control: ACCESS_CONTROL_QUESTIONS,
  mfa_secure_comms: MFA_SECURE_COMMS_QUESTIONS,
  asset_management: ASSET_MANAGEMENT_QUESTIONS,
  hr_security: HR_SECURITY_QUESTIONS,
};

/**
 * Get all default questions as a flat array with display order
 */
export function getDefaultQuestionsWithOrder(templateId: string): CreateQuestionInput[] {
  let displayOrder = 0;
  const questions: CreateQuestionInput[] = [];

  // Use the ordered categories for proper NIS2 article sequence
  const orderedCategories: NIS2Category[] = [
    'policies',
    'incident_handling',
    'business_continuity',
    'supply_chain',
    'vulnerability_management',
    'effectiveness_assessment',
    'security_awareness',
    'cryptography',
    'access_control',
    'mfa_secure_comms',
  ];

  for (const category of orderedCategories) {
    const categoryQuestions = DEFAULT_QUESTIONS[category] || [];
    let isFirstInCategory = true;

    for (const question of categoryQuestions) {
      questions.push({
        ...question,
        template_id: templateId,
        display_order: displayOrder++,
        section_title: isFirstInCategory ? getCategoryLabel(category) : undefined,
      });
      isFirstInCategory = false;
    }
  }

  return questions;
}

/**
 * Get questions for specific categories
 */
export function getQuestionsForCategories(
  templateId: string,
  categories: NIS2Category[]
): CreateQuestionInput[] {
  let displayOrder = 0;
  const questions: CreateQuestionInput[] = [];

  for (const category of categories) {
    const categoryQuestions = DEFAULT_QUESTIONS[category] || [];
    let isFirstInCategory = true;

    for (const question of categoryQuestions) {
      questions.push({
        ...question,
        template_id: templateId,
        display_order: displayOrder++,
        section_title: isFirstInCategory ? getCategoryLabel(category) : undefined,
      });
      isFirstInCategory = false;
    }
  }

  return questions;
}

/**
 * Get human-readable label for category
 */
export function getCategoryLabel(category: NIS2Category): string {
  const labels: Record<NIS2Category, string> = {
    policies: 'Risk Analysis & Security Policies',
    incident_handling: 'Incident Handling',
    business_continuity: 'Business Continuity & Crisis Management',
    supply_chain: 'Supply Chain Security',
    vulnerability_management: 'System Security & Vulnerability Handling',
    effectiveness_assessment: 'Effectiveness Assessment',
    security_awareness: 'Cyber Hygiene & Training',
    cryptography: 'Cryptography & Encryption',
    access_control: 'HR Security, Access Control & Assets',
    mfa_secure_comms: 'MFA & Secure Communications',
    asset_management: 'Asset Management',
    hr_security: 'HR Security',
  };
  return labels[category];
}

/**
 * Get NIS2 article reference for category
 */
export function getCategoryArticle(category: NIS2Category): string {
  const articles: Record<NIS2Category, string> = {
    policies: 'Article 21(2)(a)',
    incident_handling: 'Article 21(2)(b)',
    business_continuity: 'Article 21(2)(c)',
    supply_chain: 'Article 21(2)(d)',
    vulnerability_management: 'Article 21(2)(e)',
    effectiveness_assessment: 'Article 21(2)(f)',
    security_awareness: 'Article 21(2)(g)',
    cryptography: 'Article 21(2)(h)',
    access_control: 'Article 21(2)(i)',
    mfa_secure_comms: 'Article 21(2)(j)',
    asset_management: 'Article 21(2)(i)',
    hr_security: 'Article 21(2)(i)',
  };
  return articles[category];
}

/**
 * Get category description
 */
export function getCategoryDescription(category: NIS2Category): string {
  const descriptions: Record<NIS2Category, string> = {
    policies: 'Policies on risk analysis and information system security',
    incident_handling: 'Procedures for detecting, responding to, and managing security incidents',
    business_continuity: 'Backup management, disaster recovery, and crisis management',
    supply_chain: 'Security aspects concerning relationships with suppliers and service providers',
    vulnerability_management: 'Security in network and information systems acquisition, development, maintenance, and vulnerability disclosure',
    effectiveness_assessment: 'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures',
    security_awareness: 'Basic cyber hygiene practices and cybersecurity training',
    cryptography: 'Policies and procedures regarding the use of cryptography and encryption',
    access_control: 'Human resources security, access control policies and asset management',
    mfa_secure_comms: 'Multi-factor authentication, continuous authentication, and secured communications',
    asset_management: 'Asset inventory and management',
    hr_security: 'Human resources security controls',
  };
  return descriptions[category];
}

/**
 * Count total default questions
 */
export function getTotalDefaultQuestionCount(): number {
  // Only count main categories (not legacy aliases)
  const mainCategories: NIS2Category[] = [
    'policies',
    'incident_handling',
    'business_continuity',
    'supply_chain',
    'vulnerability_management',
    'effectiveness_assessment',
    'security_awareness',
    'cryptography',
    'access_control',
    'mfa_secure_comms',
  ];

  return mainCategories.reduce(
    (total, category) => total + (DEFAULT_QUESTIONS[category]?.length || 0),
    0
  );
}

/**
 * Count questions per category
 */
export function getQuestionCountByCategory(): Record<NIS2Category, number> {
  const counts: Partial<Record<NIS2Category, number>> = {};
  for (const [category, questions] of Object.entries(DEFAULT_QUESTIONS)) {
    counts[category as NIS2Category] = questions.length;
  }
  return counts as Record<NIS2Category, number>;
}

/**
 * Get recommended template configurations
 */
export const TEMPLATE_PRESETS = {
  comprehensive: {
    name: 'NIS2 Comprehensive Assessment',
    description: 'Complete vendor security assessment covering all 10 NIS2 Article 21 measures. Recommended for critical/high-risk vendors.',
    categories: [
      'policies',
      'incident_handling',
      'business_continuity',
      'supply_chain',
      'vulnerability_management',
      'effectiveness_assessment',
      'security_awareness',
      'cryptography',
      'access_control',
      'mfa_secure_comms',
    ] as NIS2Category[],
    estimated_minutes: 45,
  },
  standard: {
    name: 'NIS2 Standard Assessment',
    description: 'Core security assessment covering essential NIS2 requirements. Suitable for medium-risk vendors.',
    categories: [
      'policies',
      'incident_handling',
      'business_continuity',
      'supply_chain',
      'vulnerability_management',
      'access_control',
    ] as NIS2Category[],
    estimated_minutes: 25,
  },
  quick: {
    name: 'NIS2 Quick Assessment',
    description: 'Rapid assessment for initial vendor screening. Focus on critical security controls.',
    categories: [
      'policies',
      'incident_handling',
      'access_control',
    ] as NIS2Category[],
    estimated_minutes: 10,
  },
  supply_chain_focus: {
    name: 'Supply Chain Security Focus',
    description: 'Deep dive into supply chain and third-party risk management. For vendors with significant subcontractors.',
    categories: [
      'policies',
      'supply_chain',
      'access_control',
      'effectiveness_assessment',
    ] as NIS2Category[],
    estimated_minutes: 20,
  },
};
