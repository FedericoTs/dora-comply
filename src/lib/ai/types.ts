/**
 * AI Contract Analysis Types
 *
 * Types for AI-powered contract clause extraction and DORA compliance analysis
 */

// ============================================================================
// Extraction Types
// ============================================================================

export type ProvisionStatus =
  | 'present'      // Clause clearly present and comprehensive
  | 'partial'      // Some coverage but gaps exist
  | 'missing'      // Not found in the contract
  | 'not_analyzed' // Analysis not yet performed
  | 'unclear';     // Found but unclear/ambiguous

export interface ExtractedProvision {
  status: ProvisionStatus;
  confidence: number;        // 0-1 confidence score
  excerpts: string[];        // Relevant text excerpts
  location: string | null;   // e.g., "Section 5.2, Page 12"
  analysis: string | null;   // AI analysis/commentary
  gaps?: string[];           // Identified gaps if partial
}

export interface ExtractedArticle30_2 {
  service_description: ExtractedProvision;
  data_locations: ExtractedProvision;
  data_protection: ExtractedProvision;
  availability_guarantees: ExtractedProvision;
  incident_support: ExtractedProvision;
  authority_cooperation: ExtractedProvision;
  termination_rights: ExtractedProvision;
  subcontracting_conditions: ExtractedProvision;
}

export interface ExtractedArticle30_3 {
  sla_targets: ExtractedProvision;
  notice_periods: ExtractedProvision;
  business_continuity: ExtractedProvision;
  ict_security: ExtractedProvision;
  tlpt_participation: ExtractedProvision;
  audit_rights: ExtractedProvision;
  exit_strategy: ExtractedProvision;
  performance_access: ExtractedProvision;
}

export interface ExtractedParty {
  name: string;
  role: 'provider' | 'customer' | 'other';
  jurisdiction?: string;
}

export interface ExtractedKeyDate {
  type: 'effective' | 'expiry' | 'renewal' | 'notice' | 'other';
  date: string;
  description: string;
}

export interface ExtractedFinancialTerms {
  currency?: string;
  annual_value?: number;
  total_value?: number;
  payment_terms?: string;
  penalties?: string[];
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
}

export interface ComplianceGap {
  provision: string;
  article: string;
  description: string;
  remediation: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface ContractAnalysisResult {
  // Document Info
  documentId: string;
  pageCount: number;
  wordCount: number;

  // Contract Identification
  contractType: string | null;
  parties: ExtractedParty[];
  effectiveDate: string | null;
  expiryDate: string | null;
  governingLaw: string | null;

  // DORA Provisions
  article30_2: ExtractedArticle30_2;
  article30_3: ExtractedArticle30_3;

  // Additional Extracted Data
  keyDates: ExtractedKeyDate[];
  financialTerms: ExtractedFinancialTerms;
  riskFlags: RiskFlag[];
  complianceGaps: ComplianceGap[];

  // Scoring
  overallComplianceScore: number;
  article30_2Score: number;
  article30_3Score: number;
  confidenceScore: number;

  // Metadata
  extractionModel: string;
  processingTimeMs: number;
}

// ============================================================================
// Analysis Request Types
// ============================================================================

export interface AnalyzeContractRequest {
  documentId: string;
  contractId?: string;
  organizationId: string;
  includeCriticalProvisions?: boolean; // Include Article 30.3 analysis
  language?: string; // Contract language (for non-English contracts)
}

export interface AnalysisProgress {
  status: 'pending' | 'extracting_text' | 'analyzing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  error?: string;
}

// ============================================================================
// Database Record Type
// ============================================================================

export interface ParsedContractRecord {
  id: string;
  document_id: string;
  contract_id: string | null;
  organization_id: string;
  extraction_model: string;
  extraction_version: string;
  extracted_at: string;
  processing_time_ms: number | null;
  raw_text: string | null;
  page_count: number | null;
  word_count: number | null;
  identified_contract_type: string | null;
  identified_parties: ExtractedParty[];
  identified_effective_date: string | null;
  identified_expiry_date: string | null;
  identified_governing_law: string | null;
  article_30_2: ExtractedArticle30_2;
  article_30_3: ExtractedArticle30_3;
  key_dates: ExtractedKeyDate[];
  financial_terms: ExtractedFinancialTerms;
  risk_flags: RiskFlag[];
  compliance_gaps: ComplianceGap[];
  overall_compliance_score: number | null;
  article_30_2_score: number | null;
  article_30_3_score: number | null;
  confidence_score: number | null;
  status: 'processing' | 'completed' | 'failed' | 'needs_review';
  error_message: string | null;
  // Sign-off fields for formal AI output confirmation
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_confirmed: boolean;
  reviewer_name: string | null;
  review_notes: string | null;
  legal_acknowledgment_accepted: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Sign-off Types
// ============================================================================

export interface SignOffRequest {
  analysisId: string;
  reviewerName: string;
  reviewNotes?: string;
  legalAcknowledgmentAccepted: boolean;
  confirmations: {
    reviewedProvisions: boolean;
    reviewedRisks: boolean;
    reviewedGaps: boolean;
    understandsLimitations: boolean;
  };
}

export interface SignOffResult {
  success: boolean;
  reviewedAt: string;
  reviewedBy: string;
  canApplyToContract: boolean;
}

// ============================================================================
// Prompt Template Types
// ============================================================================

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: object;
}
