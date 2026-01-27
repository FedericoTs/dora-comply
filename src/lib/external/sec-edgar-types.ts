/**
 * SEC EDGAR API Types
 *
 * Type definitions for SEC EDGAR integration.
 * Provides access to US company filings (10-K, 10-Q, 8-K, etc.)
 * Free API - no authentication required.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * SEC filing form types
 */
export type SECFormType =
  | '10-K'     // Annual report
  | '10-Q'     // Quarterly report
  | '8-K'      // Current report (material events)
  | '10-K/A'   // Amended annual report
  | '10-Q/A'   // Amended quarterly report
  | '8-K/A'    // Amended current report
  | 'DEF 14A'  // Definitive proxy statement
  | 'S-1'      // Registration statement
  | '4'        // Insider trading
  | 'SC 13G'   // Beneficial ownership
  | 'SC 13D'   // Beneficial ownership
  | 'OTHER';

/**
 * Human-readable form type labels
 */
export const FORM_TYPE_LABELS: Record<SECFormType, string> = {
  '10-K': 'Annual Report',
  '10-Q': 'Quarterly Report',
  '8-K': 'Current Report',
  '10-K/A': 'Amended Annual Report',
  '10-Q/A': 'Amended Quarterly Report',
  '8-K/A': 'Amended Current Report',
  'DEF 14A': 'Proxy Statement',
  'S-1': 'Registration Statement',
  '4': 'Insider Trading',
  'SC 13G': 'Beneficial Ownership',
  'SC 13D': 'Beneficial Ownership',
  'OTHER': 'Other Filing',
};

/**
 * Form type descriptions
 */
export const FORM_TYPE_DESCRIPTIONS: Record<SECFormType, string> = {
  '10-K': 'Comprehensive annual financial report required by SEC',
  '10-Q': 'Quarterly financial report with unaudited statements',
  '8-K': 'Report of material events (acquisitions, leadership changes, etc.)',
  '10-K/A': 'Amendment to previously filed annual report',
  '10-Q/A': 'Amendment to previously filed quarterly report',
  '8-K/A': 'Amendment to previously filed current report',
  'DEF 14A': 'Proxy statement for shareholder meeting',
  'S-1': 'IPO registration statement',
  '4': 'Statement of changes in beneficial ownership (insider trades)',
  'SC 13G': 'Passive beneficial ownership statement',
  'SC 13D': 'Active beneficial ownership statement',
  'OTHER': 'Other SEC filing',
};

/**
 * Risk-relevant form types for TPRM
 */
export const RISK_RELEVANT_FORMS: SECFormType[] = [
  '10-K',
  '10-Q',
  '8-K',
  '8-K/A',
];

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Company information from EDGAR
 */
export interface SECCompany {
  cik: string;              // Central Index Key (10-digit, zero-padded)
  name: string;
  ticker?: string;
  exchange?: string;
  sicCode?: string;         // Standard Industrial Classification
  sicDescription?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  filings?: SECFiling[];
}

/**
 * Individual SEC filing
 */
export interface SECFiling {
  accessionNumber: string;  // Unique filing ID
  cik: string;
  form: SECFormType | string;
  filedAt: string;          // ISO timestamp
  acceptedAt?: string;
  reportDate?: string;      // Period of report
  primaryDocument?: string; // Main document filename
  primaryDocUrl?: string;   // Full URL to main document
  filingUrl: string;        // URL to filing index
  description?: string;
  items?: string[];         // 8-K items
  size?: number;            // File size in bytes
}

/**
 * 8-K item types (material events)
 */
export type Item8K =
  | '1.01'  // Entry into Material Agreement
  | '1.02'  // Termination of Material Agreement
  | '1.03'  // Bankruptcy
  | '2.01'  // Completion of Acquisition
  | '2.02'  // Results of Operations
  | '2.03'  // Creation of Obligation
  | '2.04'  // Triggering Events (Default)
  | '2.05'  // Costs for Exit Activities
  | '2.06'  // Material Impairments
  | '3.01'  // Delisting Notice
  | '3.02'  // Unregistered Sale of Equity
  | '3.03'  // Material Modification to Rights
  | '4.01'  // Auditor Changes
  | '4.02'  // Non-Reliance on Financial Statements
  | '5.01'  // Change in Control
  | '5.02'  // Departure/Appointment of Directors/Officers
  | '5.03'  // Amendments to Articles
  | '5.04'  // Temporary Suspension of Trading
  | '5.05'  // Amendment to Code of Ethics
  | '5.06'  // Change in Shell Company Status
  | '5.07'  // Submission of Matters to Shareholder Vote
  | '5.08'  // Shareholder Nominations
  | '7.01'  // Regulation FD Disclosure
  | '8.01'  // Other Events
  | '9.01'; // Financial Statements

/**
 * Item 8-K labels
 */
export const ITEM_8K_LABELS: Record<string, string> = {
  '1.01': 'Entry into Material Agreement',
  '1.02': 'Termination of Material Agreement',
  '1.03': 'Bankruptcy or Receivership',
  '2.01': 'Completion of Acquisition/Disposition',
  '2.02': 'Results of Operations',
  '2.03': 'Creation of Direct Financial Obligation',
  '2.04': 'Triggering Events (Acceleration of Debt)',
  '2.05': 'Costs Associated with Exit Activities',
  '2.06': 'Material Impairments',
  '3.01': 'Notice of Delisting',
  '3.02': 'Unregistered Sale of Equity',
  '3.03': 'Material Modification to Rights',
  '4.01': 'Changes in Registrant\'s Certifying Accountant',
  '4.02': 'Non-Reliance on Previously Issued Financial Statements',
  '5.01': 'Changes in Control of Registrant',
  '5.02': 'Departure/Appointment of Directors or Officers',
  '5.03': 'Amendments to Articles of Incorporation',
  '5.04': 'Temporary Suspension of Trading',
  '5.05': 'Amendment to Code of Ethics',
  '5.06': 'Change in Shell Company Status',
  '5.07': 'Submission of Matters to Shareholder Vote',
  '5.08': 'Shareholder Director Nominations',
  '7.01': 'Regulation FD Disclosure',
  '8.01': 'Other Events',
  '9.01': 'Financial Statements and Exhibits',
};

/**
 * High-risk 8-K items for TPRM alerts
 */
export const HIGH_RISK_8K_ITEMS: Item8K[] = [
  '1.02', // Termination of Material Agreement
  '1.03', // Bankruptcy
  '2.04', // Default/Acceleration
  '2.05', // Exit Activities
  '2.06', // Material Impairments
  '3.01', // Delisting
  '4.01', // Auditor Changes
  '4.02', // Non-Reliance on Financials
  '5.01', // Change in Control
  '5.02', // Leadership Departure
];

// =============================================================================
// SEARCH TYPES
// =============================================================================

/**
 * Company search result from EDGAR
 */
export interface SECCompanySearchResult {
  cik: string;
  name: string;
  ticker?: string;
}

/**
 * Filing search options
 */
export interface FilingSearchOptions {
  cik?: string;
  companyName?: string;
  forms?: SECFormType[];
  from?: string;            // Start date YYYY-MM-DD
  to?: string;              // End date YYYY-MM-DD
  limit?: number;
}

/**
 * Filings result
 */
export interface SECFilingsResult {
  company?: SECCompany;
  filings: SECFiling[];
  totalFilings: number;
  searchedAt: string;
  fromCache: boolean;
}

// =============================================================================
// CLIENT TYPES
// =============================================================================

/**
 * API error response
 */
export interface SECApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result wrapper for API calls
 */
export interface SECResult<T> {
  success: boolean;
  data?: T;
  error?: SECApiError;
  cached?: boolean;
  cachedAt?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format CIK to 10-digit zero-padded string
 */
export function formatCik(cik: string | number): string {
  return String(cik).padStart(10, '0');
}

/**
 * Parse CIK from various formats
 */
export function parseCik(input: string): string {
  // Remove leading zeros and non-numeric characters
  const cleaned = input.replace(/\D/g, '');
  return formatCik(cleaned);
}

/**
 * Check if filing is risk-relevant
 */
export function isRiskRelevant(filing: SECFiling): boolean {
  const form = filing.form as SECFormType;

  // Check if form type is risk-relevant
  if (RISK_RELEVANT_FORMS.includes(form)) {
    // For 8-K, check items
    if (form === '8-K' || form === '8-K/A') {
      if (filing.items && filing.items.length > 0) {
        return filing.items.some((item) =>
          HIGH_RISK_8K_ITEMS.includes(item as Item8K)
        );
      }
      // If no items parsed, consider it potentially risky
      return true;
    }
    return true;
  }

  return false;
}

/**
 * Calculate severity for a filing
 */
export function calculateFilingSeverity(
  filing: SECFiling
): 'low' | 'medium' | 'high' | 'critical' {
  const form = filing.form as SECFormType;

  // 8-K with high-risk items
  if (form === '8-K' || form === '8-K/A') {
    if (filing.items) {
      const hasCritical = filing.items.some((item) =>
        ['1.03', '4.02', '5.01'].includes(item)
      );
      if (hasCritical) return 'critical';

      const hasHigh = filing.items.some((item) =>
        HIGH_RISK_8K_ITEMS.includes(item as Item8K)
      );
      if (hasHigh) return 'high';
    }
    return 'medium';
  }

  // Annual/Quarterly reports are informational
  if (form === '10-K' || form === '10-Q') {
    return 'low';
  }

  return 'low';
}

/**
 * Get Tailwind color for filing severity
 */
export function severityToColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity] || colors.low;
}

/**
 * Get background color for filing form type
 */
export function formTypeToBgColor(form: string): string {
  if (form.startsWith('8-K')) return 'bg-orange-500/10';
  if (form.startsWith('10-K')) return 'bg-blue-500/10';
  if (form.startsWith('10-Q')) return 'bg-blue-500/10';
  if (form === 'DEF 14A') return 'bg-purple-500/10';
  return 'bg-gray-500/10';
}

/**
 * Build EDGAR filing URL
 */
export function buildFilingUrl(cik: string, accessionNumber: string): string {
  const cleanCik = cik.replace(/^0+/, ''); // Remove leading zeros
  const cleanAccession = accessionNumber.replace(/-/g, ''); // Remove dashes
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cleanCik}&type=&dateb=&owner=include&count=40&search_text=`;
}

/**
 * Build URL to filing document
 */
export function buildDocumentUrl(
  cik: string,
  accessionNumber: string,
  primaryDocument: string
): string {
  const cleanCik = cik.replace(/^0+/, '');
  const cleanAccession = accessionNumber.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cleanCik}/${cleanAccession}/${primaryDocument}`;
}
