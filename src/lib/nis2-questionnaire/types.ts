/**
 * NIS2 Vendor Questionnaire System - Type Definitions
 *
 * Types for questionnaire templates, vendor responses, and AI extraction
 */

// ============================================================================
// ENUMS (mirror database enums)
// ============================================================================

export type QuestionnaireStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type AnswerSource =
  | 'manual'
  | 'ai_extracted'
  | 'ai_confirmed'
  | 'ai_modified';

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'number'
  | 'file';

export type ExtractionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type DocumentType =
  | 'soc2'
  | 'iso27001'
  | 'policy'
  | 'certificate'
  | 'other';

// ============================================================================
// NIS2 Article 21 Categories
// ============================================================================

export type NIS2Category =
  | 'policies'
  | 'incident_handling'
  | 'business_continuity'
  | 'supply_chain'
  | 'vulnerability_management'
  | 'effectiveness_assessment'
  | 'security_awareness'
  | 'cryptography'
  | 'access_control'
  | 'mfa_secure_comms'
  | 'asset_management'
  | 'hr_security';

export const NIS2_CATEGORIES: Record<NIS2Category, { label: string; article: string; description: string }> = {
  policies: {
    label: 'Risk Analysis & Security Policies',
    article: '21(2)(a)',
    description: 'Policies on risk analysis and information system security'
  },
  incident_handling: {
    label: 'Incident Handling',
    article: '21(2)(b)',
    description: 'Procedures for detecting, responding to, and managing security incidents'
  },
  business_continuity: {
    label: 'Business Continuity & Crisis Management',
    article: '21(2)(c)',
    description: 'Backup management, disaster recovery, and crisis management'
  },
  supply_chain: {
    label: 'Supply Chain Security',
    article: '21(2)(d)',
    description: 'Security aspects concerning relationships with suppliers and service providers'
  },
  vulnerability_management: {
    label: 'System Security & Vulnerability Handling',
    article: '21(2)(e)',
    description: 'Security in network and information systems acquisition, development, maintenance, and vulnerability disclosure'
  },
  effectiveness_assessment: {
    label: 'Effectiveness Assessment',
    article: '21(2)(f)',
    description: 'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures'
  },
  security_awareness: {
    label: 'Cyber Hygiene & Training',
    article: '21(2)(g)',
    description: 'Basic cyber hygiene practices and cybersecurity training'
  },
  cryptography: {
    label: 'Cryptography & Encryption',
    article: '21(2)(h)',
    description: 'Policies and procedures regarding the use of cryptography and encryption'
  },
  access_control: {
    label: 'HR Security, Access Control & Assets',
    article: '21(2)(i)',
    description: 'Human resources security, access control policies and asset management'
  },
  mfa_secure_comms: {
    label: 'MFA & Secure Communications',
    article: '21(2)(j)',
    description: 'Multi-factor authentication, continuous authentication, and secured communications'
  },
  // Legacy aliases for backward compatibility
  asset_management: {
    label: 'Asset Management',
    article: '21(2)(i)',
    description: 'Asset inventory and management (part of Article 21(2)(i))'
  },
  hr_security: {
    label: 'HR Security',
    article: '21(2)(i)',
    description: 'Human resources security (part of Article 21(2)(i))'
  },
};

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Questionnaire Template (reusable)
 */
export interface QuestionnaireTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  version: number;
  nis2_categories: NIS2Category[];
  is_default: boolean;
  is_active: boolean;
  estimated_completion_minutes: number;
  times_used: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Question option for select/multiselect types
 */
export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Validation rules for questions
 */
export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

/**
 * Template Question
 */
export interface TemplateQuestion {
  id: string;
  template_id: string;
  question_text: string;
  help_text: string | null;
  question_type: QuestionType;
  options: QuestionOption[];
  is_required: boolean;
  validation_rules: ValidationRules;
  ai_extraction_enabled: boolean;
  ai_extraction_keywords: string[];
  ai_extraction_prompt: string | null;
  ai_confidence_threshold: number;
  category: NIS2Category;
  subcategory: string | null;
  display_order: number;
  section_title: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor Questionnaire instance
 */
export interface VendorQuestionnaire {
  id: string;
  organization_id: string;
  vendor_id: string;
  template_id: string;
  access_token: string;
  token_expires_at: string;
  status: QuestionnaireStatus;
  vendor_email: string;
  vendor_name: string | null;
  vendor_contact_name: string | null;
  progress_percentage: number;
  questions_total: number;
  questions_answered: number;
  questions_ai_filled: number;
  sent_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
  review_notes: string | null;
  due_date: string | null;
  last_reminder_at: string | null;
  reminder_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Questionnaire Answer
 */
export interface QuestionnaireAnswer {
  id: string;
  questionnaire_id: string;
  question_id: string;
  answer_text: string | null;
  answer_json: unknown | null;
  source: AnswerSource;
  ai_confidence: number | null;
  ai_citation: string | null;
  ai_extraction_id: string | null;
  vendor_confirmed: boolean;
  vendor_confirmed_at: string | null;
  original_ai_answer: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Questionnaire Document (uploaded by vendor)
 */
export interface QuestionnaireDocument {
  id: string;
  questionnaire_id: string;
  document_id: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  document_type: DocumentType;
  document_type_other: string | null;
  ai_processed: boolean;
  ai_processed_at: string | null;
  ai_extraction_id: string | null;
  uploaded_at: string;
}

/**
 * AI Extraction Job
 */
export interface AIExtraction {
  id: string;
  questionnaire_id: string;
  document_id: string | null;
  status: ExtractionStatus;
  started_at: string | null;
  completed_at: string | null;
  model_name: string;
  model_version: string | null;
  extracted_answers: ExtractedAnswer[];
  extraction_summary: ExtractionSummary;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AI EXTRACTION TYPES
// ============================================================================

/**
 * Single extracted answer from AI
 */
export interface ExtractedAnswer {
  question_id: string;
  answer: string;
  confidence: number;
  citation: string;
  extraction_notes?: string;
}

/**
 * Summary of extraction job
 */
export interface ExtractionSummary {
  total_questions: number;
  total_extracted: number;
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  avg_confidence: number;
  document_pages_processed: number;
}

// ============================================================================
// VIEW TYPES (from database views)
// ============================================================================

/**
 * Questionnaire summary view
 */
export interface QuestionnaireSummary {
  id: string;
  organization_id: string;
  vendor_id: string;
  template_id: string;
  status: QuestionnaireStatus;
  vendor_email: string;
  vendor_name: string | null;
  progress_percentage: number;
  questions_total: number;
  questions_answered: number;
  questions_ai_filled: number;
  due_date: string | null;
  sent_at: string | null;
  submitted_at: string | null;
  created_at: string;
  vendor_company_name: string | null;
  template_name: string | null;
  alert_status: 'Pending Review' | 'Overdue' | 'Due Soon' | null;
}

/**
 * Organization questionnaire stats view
 */
export interface QuestionnaireStats {
  organization_id: string;
  total_questionnaires: number;
  draft_count: number;
  sent_count: number;
  in_progress_count: number;
  submitted_count: number;
  approved_count: number;
  rejected_count: number;
  expired_count: number;
  avg_progress: number | null;
  avg_ai_fill_rate: number | null;
}

// ============================================================================
// VENDOR PORTAL TYPES
// Note: API input types (CreateTemplateInput, CreateQuestionInput, etc.)
// are defined in schemas.ts using Zod inference
// ============================================================================

/**
 * Token validation result
 */
export interface TokenValidationResult {
  questionnaire_id: string | null;
  organization_name: string | null;
  vendor_name: string | null;
  template_name: string | null;
  status: QuestionnaireStatus | null;
  is_valid: boolean;
  message: string;
}

/**
 * Vendor portal questionnaire data
 */
export interface VendorPortalData {
  questionnaire: VendorQuestionnaire;
  template: QuestionnaireTemplate;
  questions: TemplateQuestion[];
  answers: QuestionnaireAnswer[];
  documents: QuestionnaireDocument[];
  organization_name: string;
  vendor_company_name: string;
}

/**
 * Questionnaire step in wizard
 */
export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

/**
 * Question with answer (for display)
 */
export interface QuestionWithAnswer extends TemplateQuestion {
  answer?: QuestionnaireAnswer;
}

/**
 * Section with questions (grouped for display)
 */
export interface QuestionSection {
  title: string;
  category: NIS2Category;
  questions: QuestionWithAnswer[];
  completedCount: number;
  totalCount: number;
}

/**
 * AI suggestion for a question
 */
export interface AISuggestion {
  question_id: string;
  suggested_answer: string;
  confidence: number;
  citation: string;
  is_high_confidence: boolean;
}

/**
 * Filter options for questionnaire list
 */
export interface QuestionnaireFilters {
  status?: QuestionnaireStatus[];
  vendor_id?: string;
  template_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

/**
 * Sort options for questionnaire list
 */
export interface QuestionnaireSort {
  field: 'created_at' | 'due_date' | 'progress_percentage' | 'vendor_name' | 'status' | 'submitted_at';
  direction: 'asc' | 'desc';
}
