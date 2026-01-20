/**
 * NIS2 Default Questions Library
 *
 * Pre-configured questions aligned with NIS2 Article 21 requirements
 * for vendor security assessments
 */

import type { CreateQuestionInput } from './schemas';
import type { NIS2Category } from './types';

// ============================================================================
// QUESTION TEMPLATES BY CATEGORY
// ============================================================================

interface DefaultQuestion extends Omit<CreateQuestionInput, 'template_id' | 'display_order'> {
  ai_extraction_keywords: string[];
}

/**
 * Policies on Risk Analysis & ISMS (Article 21.2.a)
 */
const POLICIES_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Does your organization have a documented Information Security Management System (ISMS)?',
    help_text: 'An ISMS is a systematic approach to managing sensitive information. Examples include ISO 27001 certified systems.',
    question_type: 'boolean',
    category: 'policies',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['ISMS', 'Information Security Management System', 'ISO 27001', 'security management'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What security certifications does your organization currently hold?',
    help_text: 'Select all that apply. Provide expiration dates in the next question.',
    question_type: 'multiselect',
    category: 'policies',
    is_required: true,
    options: [
      { value: 'iso27001', label: 'ISO 27001', description: 'Information security management' },
      { value: 'soc2_type2', label: 'SOC 2 Type II', description: 'Service organization controls' },
      { value: 'soc2_type1', label: 'SOC 2 Type I', description: 'Point-in-time SOC 2' },
      { value: 'iso22301', label: 'ISO 22301', description: 'Business continuity' },
      { value: 'pci_dss', label: 'PCI DSS', description: 'Payment card industry' },
      { value: 'c5', label: 'C5 (BSI)', description: 'German cloud security' },
      { value: 'other', label: 'Other', description: 'Specify in notes' },
      { value: 'none', label: 'None', description: 'No current certifications' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['certification', 'certified', 'ISO 27001', 'SOC 2', 'compliance'],
    ai_confidence_threshold: 0.8,
  },
  {
    question_text: 'How frequently do you conduct formal risk assessments?',
    help_text: 'NIS2 requires regular risk assessments of network and information systems.',
    question_type: 'select',
    category: 'policies',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
      { value: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
      { value: 'annually', label: 'Annually', description: 'Once per year' },
      { value: 'continuous', label: 'Continuous', description: 'Real-time monitoring' },
      { value: 'ad_hoc', label: 'Ad hoc', description: 'Only when needed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['risk assessment', 'risk review', 'frequency', 'annual', 'quarterly'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Describe your risk management methodology and framework.',
    help_text: 'Include the framework used (e.g., ISO 27005, NIST RMF) and key processes.',
    question_type: 'textarea',
    category: 'policies',
    is_required: true,
    validation_rules: { minLength: 50, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['risk management', 'methodology', 'framework', 'ISO 27005', 'NIST'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Incident Handling (Article 21.2.b)
 */
const INCIDENT_HANDLING_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you have a documented incident response plan?',
    help_text: 'NIS2 requires organizations to have procedures for handling security incidents.',
    question_type: 'boolean',
    category: 'incident_handling',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['incident response', 'incident management', 'IRP', 'incident handling'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What is your target incident notification time to affected clients?',
    help_text: 'NIS2 requires notification within 24 hours for significant incidents.',
    question_type: 'select',
    category: 'incident_handling',
    is_required: true,
    options: [
      { value: '4_hours', label: 'Within 4 hours' },
      { value: '24_hours', label: 'Within 24 hours' },
      { value: '72_hours', label: 'Within 72 hours' },
      { value: 'variable', label: 'Varies by severity' },
      { value: 'not_defined', label: 'Not defined' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['notification', 'incident notification', 'response time', '24 hours', '72 hours'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you have a dedicated security operations center (SOC) or equivalent?',
    help_text: 'A SOC provides 24/7 security monitoring and incident response capabilities.',
    question_type: 'select',
    category: 'incident_handling',
    is_required: true,
    options: [
      { value: 'internal_24_7', label: 'Internal SOC (24/7)' },
      { value: 'internal_business_hours', label: 'Internal SOC (business hours)' },
      { value: 'outsourced_24_7', label: 'Outsourced SOC (24/7)' },
      { value: 'hybrid', label: 'Hybrid (internal + outsourced)' },
      { value: 'none', label: 'No dedicated SOC' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['SOC', 'security operations', 'monitoring', '24/7', 'SIEM'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Describe your incident classification and escalation procedures.',
    help_text: 'How do you classify incident severity and escalate to appropriate teams?',
    question_type: 'textarea',
    category: 'incident_handling',
    is_required: true,
    validation_rules: { minLength: 50, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['classification', 'escalation', 'severity', 'triage', 'incident'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Business Continuity & Disaster Recovery (Article 21.2.c)
 */
const BUSINESS_CONTINUITY_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you have a documented Business Continuity Plan (BCP)?',
    help_text: 'A BCP ensures critical business functions continue during and after disasters.',
    question_type: 'boolean',
    category: 'business_continuity',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['business continuity', 'BCP', 'DR', 'disaster recovery'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What is your Recovery Time Objective (RTO) for critical systems?',
    help_text: 'RTO is the maximum acceptable time to restore a system after a disruption.',
    question_type: 'select',
    category: 'business_continuity',
    is_required: true,
    options: [
      { value: '1_hour', label: 'Less than 1 hour' },
      { value: '4_hours', label: '1-4 hours' },
      { value: '24_hours', label: '4-24 hours' },
      { value: '72_hours', label: '24-72 hours' },
      { value: 'over_72_hours', label: 'Over 72 hours' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['RTO', 'recovery time', 'restore', 'downtime'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'What is your Recovery Point Objective (RPO) for critical data?',
    help_text: 'RPO is the maximum acceptable data loss measured in time.',
    question_type: 'select',
    category: 'business_continuity',
    is_required: true,
    options: [
      { value: 'zero', label: 'Zero data loss (synchronous)' },
      { value: '1_hour', label: 'Less than 1 hour' },
      { value: '4_hours', label: '1-4 hours' },
      { value: '24_hours', label: '4-24 hours' },
      { value: 'over_24_hours', label: 'Over 24 hours' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['RPO', 'recovery point', 'data loss', 'backup'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you test your disaster recovery procedures?',
    help_text: 'Regular testing ensures DR plans work when needed.',
    question_type: 'select',
    category: 'business_continuity',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'semi_annually', label: 'Semi-annually' },
      { value: 'annually', label: 'Annually' },
      { value: 'never', label: 'Not tested' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['DR test', 'disaster recovery test', 'BCP test', 'testing'],
    ai_confidence_threshold: 0.6,
  },
];

/**
 * Supply Chain Security (Article 21.2.d)
 */
const SUPPLY_CHAIN_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you maintain a register of your critical ICT third-party providers?',
    help_text: 'NIS2 requires organizations to manage supply chain risks.',
    question_type: 'boolean',
    category: 'supply_chain',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['third party', 'vendor', 'supplier', 'subcontractor', 'register'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you assess the security posture of your subcontractors who may process our data?',
    help_text: 'Understanding 4th party risks is critical for supply chain security.',
    question_type: 'select',
    category: 'supply_chain',
    is_required: true,
    options: [
      { value: 'yes_all', label: 'Yes, all subcontractors' },
      { value: 'yes_critical', label: 'Yes, only critical subcontractors' },
      { value: 'no', label: 'No assessment performed' },
      { value: 'no_subcontractors', label: 'No subcontractors used' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['subcontractor', 'subservice', 'fourth party', '4th party', 'supply chain'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'List your critical subcontractors/subservice organizations.',
    help_text: 'Include cloud providers, data centers, and any party with access to client data.',
    question_type: 'textarea',
    category: 'supply_chain',
    is_required: false,
    validation_rules: { maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['subservice organization', 'AWS', 'Azure', 'Google Cloud', 'data center'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Access Control (Article 21.2.i)
 */
const ACCESS_CONTROL_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you enforce Multi-Factor Authentication (MFA) for privileged access?',
    help_text: 'MFA significantly reduces the risk of unauthorized access.',
    question_type: 'select',
    category: 'access_control',
    is_required: true,
    options: [
      { value: 'all_users', label: 'Yes, for all users' },
      { value: 'privileged_only', label: 'Yes, for privileged users only' },
      { value: 'optional', label: 'Optional (user choice)' },
      { value: 'no', label: 'Not implemented' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['MFA', 'multi-factor', 'two-factor', '2FA', 'authentication'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you follow the principle of least privilege for access control?',
    help_text: 'Users should only have access to resources necessary for their role.',
    question_type: 'boolean',
    category: 'access_control',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['least privilege', 'RBAC', 'role-based', 'access control', 'permissions'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you conduct access reviews?',
    help_text: 'Regular reviews ensure access rights remain appropriate.',
    question_type: 'select',
    category: 'access_control',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'semi_annually', label: 'Semi-annually' },
      { value: 'annually', label: 'Annually' },
      { value: 'continuous', label: 'Continuous monitoring' },
      { value: 'never', label: 'Not performed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['access review', 'user access', 'entitlement review', 'periodic review'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Describe your privileged access management (PAM) approach.',
    help_text: 'How do you manage and monitor privileged/admin accounts?',
    question_type: 'textarea',
    category: 'access_control',
    is_required: true,
    validation_rules: { minLength: 50, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['PAM', 'privileged access', 'admin', 'elevated', 'superuser'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Cryptography (Article 21.2.h)
 */
const CRYPTOGRAPHY_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you encrypt data at rest?',
    help_text: 'Data at rest encryption protects stored data from unauthorized access.',
    question_type: 'select',
    category: 'cryptography',
    is_required: true,
    options: [
      { value: 'all_data', label: 'Yes, all data' },
      { value: 'sensitive_only', label: 'Yes, sensitive data only' },
      { value: 'no', label: 'No encryption at rest' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['encryption at rest', 'AES', 'encrypted storage', 'disk encryption'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'Do you encrypt data in transit?',
    help_text: 'Data in transit should be protected using TLS 1.2 or higher.',
    question_type: 'select',
    category: 'cryptography',
    is_required: true,
    options: [
      { value: 'tls_1_3', label: 'Yes, TLS 1.3' },
      { value: 'tls_1_2', label: 'Yes, TLS 1.2' },
      { value: 'tls_mixed', label: 'Mixed (1.2 and 1.3)' },
      { value: 'older', label: 'Older protocols (TLS 1.1 or below)' },
      { value: 'no', label: 'No encryption in transit' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['TLS', 'encryption in transit', 'HTTPS', 'SSL', 'transport encryption'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How do you manage encryption keys?',
    help_text: 'Describe key management practices including rotation and storage.',
    question_type: 'textarea',
    category: 'cryptography',
    is_required: true,
    validation_rules: { minLength: 30, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['key management', 'KMS', 'HSM', 'key rotation', 'encryption key'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Vulnerability Management (Article 21.2.e)
 */
const VULNERABILITY_MANAGEMENT_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'How frequently do you perform vulnerability scanning?',
    help_text: 'Regular scanning helps identify and remediate security weaknesses.',
    question_type: 'select',
    category: 'vulnerability_management',
    is_required: true,
    options: [
      { value: 'continuous', label: 'Continuous / Real-time' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
      { value: 'never', label: 'Not performed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['vulnerability scan', 'scanning', 'assessment', 'security testing'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'How frequently do you conduct penetration testing?',
    help_text: 'Penetration tests simulate real attacks to identify vulnerabilities.',
    question_type: 'select',
    category: 'vulnerability_management',
    is_required: true,
    options: [
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'semi_annually', label: 'Semi-annually' },
      { value: 'annually', label: 'Annually' },
      { value: 'on_change', label: 'After significant changes' },
      { value: 'never', label: 'Not performed' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['penetration test', 'pentest', 'ethical hacking', 'security test'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'What is your target remediation time for critical vulnerabilities?',
    help_text: 'Critical vulnerabilities should be addressed urgently.',
    question_type: 'select',
    category: 'vulnerability_management',
    is_required: true,
    options: [
      { value: '24_hours', label: 'Within 24 hours' },
      { value: '7_days', label: 'Within 7 days' },
      { value: '30_days', label: 'Within 30 days' },
      { value: '90_days', label: 'Within 90 days' },
      { value: 'not_defined', label: 'Not defined' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['remediation', 'patch', 'SLA', 'vulnerability', 'critical'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Describe your patch management process.',
    help_text: 'How do you identify, test, and deploy security patches?',
    question_type: 'textarea',
    category: 'vulnerability_management',
    is_required: true,
    validation_rules: { minLength: 50, maxLength: 2000 },
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['patch management', 'patching', 'update', 'security patch'],
    ai_confidence_threshold: 0.5,
  },
];

/**
 * Security Awareness & Training (Article 21.2.g)
 */
const SECURITY_AWARENESS_QUESTIONS: DefaultQuestion[] = [
  {
    question_text: 'Do you provide security awareness training to all employees?',
    help_text: 'NIS2 requires appropriate cyber hygiene practices and training.',
    question_type: 'boolean',
    category: 'security_awareness',
    is_required: true,
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['security training', 'awareness', 'training', 'cyber hygiene'],
    ai_confidence_threshold: 0.7,
  },
  {
    question_text: 'How frequently is security awareness training conducted?',
    help_text: 'Regular training keeps employees aware of current threats.',
    question_type: 'select',
    category: 'security_awareness',
    is_required: true,
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
      { value: 'onboarding_only', label: 'At onboarding only' },
      { value: 'never', label: 'Not provided' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['training frequency', 'annual training', 'security awareness'],
    ai_confidence_threshold: 0.6,
  },
  {
    question_text: 'Do you conduct phishing simulations?',
    help_text: 'Phishing simulations help test and improve employee awareness.',
    question_type: 'select',
    category: 'security_awareness',
    is_required: true,
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
      { value: 'no', label: 'Not conducted' },
    ],
    ai_extraction_enabled: true,
    ai_extraction_keywords: ['phishing', 'simulation', 'social engineering', 'awareness test'],
    ai_confidence_threshold: 0.6,
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
  access_control: ACCESS_CONTROL_QUESTIONS,
  cryptography: CRYPTOGRAPHY_QUESTIONS,
  vulnerability_management: VULNERABILITY_MANAGEMENT_QUESTIONS,
  security_awareness: SECURITY_AWARENESS_QUESTIONS,
  asset_management: [], // To be added
  hr_security: [], // To be added
};

/**
 * Get all default questions as a flat array with display order
 */
export function getDefaultQuestionsWithOrder(templateId: string): CreateQuestionInput[] {
  let displayOrder = 0;
  const questions: CreateQuestionInput[] = [];

  for (const [category, categoryQuestions] of Object.entries(DEFAULT_QUESTIONS)) {
    for (const question of categoryQuestions) {
      questions.push({
        ...question,
        template_id: templateId,
        display_order: displayOrder++,
        section_title: displayOrder === 0 || categoryQuestions.indexOf(question) === 0
          ? getCategoryLabel(category as NIS2Category)
          : undefined,
      });
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
    policies: 'Policies on Risk Analysis & ISMS',
    incident_handling: 'Incident Handling',
    business_continuity: 'Business Continuity & Disaster Recovery',
    supply_chain: 'Supply Chain Security',
    access_control: 'Access Control',
    cryptography: 'Cryptography',
    vulnerability_management: 'Vulnerability Management',
    security_awareness: 'Security Awareness & Training',
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
    access_control: 'Article 21(2)(i)',
    cryptography: 'Article 21(2)(h)',
    vulnerability_management: 'Article 21(2)(e)',
    security_awareness: 'Article 21(2)(g)',
    asset_management: 'Article 21(2)(i)',
    hr_security: 'Article 21(2)(j)',
  };
  return articles[category];
}

/**
 * Count total default questions
 */
export function getTotalDefaultQuestionCount(): number {
  return Object.values(DEFAULT_QUESTIONS).reduce(
    (total, questions) => total + questions.length,
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
