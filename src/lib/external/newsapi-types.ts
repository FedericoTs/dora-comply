/**
 * NewsAPI Types
 *
 * Type definitions for NewsAPI.org business intelligence integration.
 * Provides company news monitoring with sentiment analysis.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Sentiment classification for news articles
 */
export type NewsSentiment = 'positive' | 'neutral' | 'negative';

/**
 * News article source information
 */
export interface NewsSource {
  id: string | null;
  name: string;
}

/**
 * Individual news article from NewsAPI
 */
export interface NewsArticle {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;      // ISO timestamp
  content: string | null;   // Truncated content (free tier)
}

/**
 * Enriched article with sentiment analysis
 */
export interface EnrichedNewsArticle extends NewsArticle {
  sentimentScore: number;   // -1 to 1
  sentimentLabel: NewsSentiment;
  relevanceScore: number;   // 0 to 1
  matchedKeywords: string[];
  alertType: NewsAlertType;
}

/**
 * Alert types for news classification
 */
export type NewsAlertType =
  | 'news'
  | 'regulatory'
  | 'financial'
  | 'leadership'
  | 'breach'
  | 'other';

/**
 * Severity levels for news alerts
 */
export type NewsSeverity = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Raw NewsAPI response structure
 */
export interface NewsApiResponse {
  status: 'ok' | 'error';
  totalResults: number;
  articles: NewsArticle[];
  code?: string;
  message?: string;
}

/**
 * Search options for NewsAPI queries
 */
export interface NewsSearchOptions {
  q?: string;                // Search keywords
  qInTitle?: string;         // Keywords in title only
  domains?: string;          // Comma-separated domains to search
  excludeDomains?: string;   // Domains to exclude
  from?: string;             // Start date (YYYY-MM-DD)
  to?: string;               // End date (YYYY-MM-DD)
  language?: string;         // Language code (default: 'en')
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;         // Results per page (max 100)
  page?: number;             // Page number
}

/**
 * Company news search result
 */
export interface CompanyNewsResult {
  company: string;
  query: string;
  totalResults: number;
  articles: EnrichedNewsArticle[];
  searchedAt: string;
  fromCache: boolean;
}

// =============================================================================
// CLIENT TYPES
// =============================================================================

/**
 * API client configuration
 */
export interface NewsApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  cacheTTL?: number;
  defaultLanguage?: string;
}

/**
 * API error response
 */
export interface NewsApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result wrapper for API calls
 */
export interface NewsApiResult<T> {
  success: boolean;
  data?: T;
  error?: NewsApiError;
  cached?: boolean;
  cachedAt?: string;
  rateLimitRemaining?: number;
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

/**
 * Keywords associated with negative sentiment
 */
export const NEGATIVE_KEYWORDS = [
  // Legal/Regulatory
  'lawsuit', 'sued', 'fine', 'fined', 'penalty', 'violation', 'regulatory',
  'investigation', 'probe', 'indictment', 'fraud', 'scandal',
  // Security/Breaches
  'breach', 'hack', 'hacked', 'leaked', 'compromised', 'vulnerability',
  'ransomware', 'malware', 'cyberattack', 'data leak', 'exposed',
  // Financial Distress
  'bankruptcy', 'layoff', 'layoffs', 'restructuring', 'downsizing',
  'default', 'debt', 'losses', 'decline', 'plunge', 'crash',
  // Leadership Issues
  'resign', 'resigned', 'fired', 'terminated', 'misconduct', 'allegations',
  // Operational
  'outage', 'failure', 'recall', 'defect', 'incident',
];

/**
 * Keywords associated with positive sentiment
 */
export const POSITIVE_KEYWORDS = [
  // Growth
  'growth', 'expansion', 'acquisition', 'partnership', 'contract',
  'revenue', 'profit', 'earnings', 'record', 'milestone',
  // Innovation
  'launch', 'innovation', 'breakthrough', 'award', 'certification',
  // Compliance
  'compliance', 'certified', 'accredited', 'approved', 'secure',
  // Leadership
  'appointed', 'hired', 'promoted', 'investment', 'funding',
];

/**
 * Keywords for alert type classification
 */
export const ALERT_TYPE_KEYWORDS: Record<NewsAlertType, string[]> = {
  breach: [
    'breach', 'hack', 'hacked', 'leaked', 'compromised', 'ransomware',
    'malware', 'cyberattack', 'data leak', 'exposed', 'vulnerability',
  ],
  regulatory: [
    'regulatory', 'compliance', 'fine', 'penalty', 'investigation',
    'SEC', 'FTC', 'GDPR', 'lawsuit', 'settlement', 'audit',
  ],
  financial: [
    'earnings', 'revenue', 'profit', 'loss', 'bankruptcy', 'IPO',
    'acquisition', 'merger', 'stock', 'valuation', 'funding',
  ],
  leadership: [
    'CEO', 'CFO', 'CTO', 'appointed', 'resigned', 'fired',
    'executive', 'board', 'management', 'leadership',
  ],
  news: [], // Default category
  other: [],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate sentiment score from text (-1 to 1)
 */
export function calculateSentiment(text: string): {
  score: number;
  label: NewsSentiment;
} {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      positiveCount++;
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      negativeCount++;
    }
  }

  const totalKeywords = positiveCount + negativeCount;
  if (totalKeywords === 0) {
    return { score: 0, label: 'neutral' };
  }

  const score = (positiveCount - negativeCount) / totalKeywords;

  let label: NewsSentiment;
  if (score > 0.2) {
    label = 'positive';
  } else if (score < -0.2) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return { score, label };
}

/**
 * Classify article into alert type
 */
export function classifyAlertType(text: string): NewsAlertType {
  const lowerText = text.toLowerCase();

  // Check each alert type's keywords (in priority order)
  const priorityOrder: NewsAlertType[] = ['breach', 'regulatory', 'leadership', 'financial'];

  for (const alertType of priorityOrder) {
    const keywords = ALERT_TYPE_KEYWORDS[alertType];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return alertType;
      }
    }
  }

  return 'news';
}

/**
 * Determine severity based on sentiment and alert type
 */
export function calculateSeverity(
  sentiment: NewsSentiment,
  alertType: NewsAlertType
): NewsSeverity {
  // Breaches are always high priority
  if (alertType === 'breach') {
    return sentiment === 'negative' ? 'critical' : 'high';
  }

  // Regulatory issues
  if (alertType === 'regulatory') {
    if (sentiment === 'negative') return 'high';
    return 'medium';
  }

  // Leadership changes
  if (alertType === 'leadership') {
    if (sentiment === 'negative') return 'high';
    return 'medium';
  }

  // Financial news
  if (alertType === 'financial') {
    if (sentiment === 'negative') return 'high';
    if (sentiment === 'positive') return 'low';
    return 'medium';
  }

  // General news
  if (sentiment === 'negative') return 'medium';
  return 'low';
}

/**
 * Get Tailwind color class for sentiment
 */
export function sentimentToColor(sentiment: NewsSentiment): string {
  const colors: Record<NewsSentiment, string> = {
    positive: 'text-green-500',
    neutral: 'text-gray-500',
    negative: 'text-red-500',
  };
  return colors[sentiment];
}

/**
 * Get background color for severity
 */
export function severityToBgColor(severity: NewsSeverity): string {
  const colors: Record<NewsSeverity, string> = {
    low: 'bg-green-500/10',
    medium: 'bg-yellow-500/10',
    high: 'bg-orange-500/10',
    critical: 'bg-red-500/10',
  };
  return colors[severity];
}

/**
 * Get text color for severity
 */
export function severityToTextColor(severity: NewsSeverity): string {
  const colors: Record<NewsSeverity, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity];
}

/**
 * Get icon for alert type
 */
export function alertTypeToIcon(alertType: NewsAlertType): string {
  const icons: Record<NewsAlertType, string> = {
    breach: 'shield-alert',
    regulatory: 'gavel',
    financial: 'trending-up',
    leadership: 'users',
    news: 'newspaper',
    other: 'info',
  };
  return icons[alertType];
}

/**
 * Get label for alert type
 */
export function alertTypeToLabel(alertType: NewsAlertType): string {
  const labels: Record<NewsAlertType, string> = {
    breach: 'Security Breach',
    regulatory: 'Regulatory',
    financial: 'Financial',
    leadership: 'Leadership',
    news: 'General News',
    other: 'Other',
  };
  return labels[alertType];
}
