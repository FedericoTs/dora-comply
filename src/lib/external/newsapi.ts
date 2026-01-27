/**
 * NewsAPI.org API Client
 *
 * Provides company news monitoring integration for business intelligence.
 * Free tier: 100 requests/day, 1 month historical data.
 *
 * Following the SecurityScorecard integration pattern for consistency.
 */

import {
  NewsApiResponse,
  NewsApiResult,
  NewsSearchOptions,
  NewsArticle,
  EnrichedNewsArticle,
  CompanyNewsResult,
  calculateSentiment,
  classifyAlertType,
  calculateSeverity,
  NEGATIVE_KEYWORDS,
} from './newsapi-types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const NEWSAPI_BASE = 'https://newsapi.org/v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (100 req/day limit)
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for API responses
const searchCache = new Map<string, CacheEntry<CompanyNewsResult>>();

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  // Clean up expired entry
  if (entry) {
    cache.delete(key);
  }
  return null;
}

function setCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T
): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearCache(): void {
  searchCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: searchCache.size,
    keys: Array.from(searchCache.keys()),
  };
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Check if NewsAPI key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.NEWSAPI_KEY;
}

/**
 * Get API key (throws if not configured)
 */
function getApiKey(): string {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    throw new Error('NEWSAPI_KEY environment variable not set');
  }
  return key;
}

/**
 * Build cache key from search options
 */
function buildCacheKey(options: NewsSearchOptions): string {
  const parts = [
    options.q || '',
    options.qInTitle || '',
    options.domains || '',
    options.from || '',
    options.to || '',
    options.language || 'en',
    String(options.pageSize || DEFAULT_PAGE_SIZE),
  ];
  return parts.join('|');
}

/**
 * Make API request to NewsAPI
 */
async function apiRequest<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<T | null> {
  try {
    const apiKey = getApiKey();

    // Build URL with query params
    const url = new URL(`${NEWSAPI_BASE}${endpoint}`);
    url.searchParams.set('apiKey', apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // 1 hour edge cache
    });

    if (response.status === 401) {
      console.error('[NewsAPI] Authentication failed - check API key');
      return null;
    }

    if (response.status === 426) {
      console.error('[NewsAPI] Upgrade required - free tier limitation');
      return null;
    }

    if (response.status === 429) {
      console.error('[NewsAPI] Rate limit exceeded (100 req/day)');
      return null;
    }

    if (!response.ok) {
      console.error(
        `[NewsAPI] API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.status === 'error') {
      console.error(`[NewsAPI] Error: ${data.code} - ${data.message}`);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error('[NewsAPI] Request failed:', error);
    return null;
  }
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Search for news about a company
 */
export async function searchCompanyNews(
  companyName: string,
  options: Partial<NewsSearchOptions> = {}
): Promise<CompanyNewsResult | null> {
  // Build search query
  const query = options.q || `"${companyName}"`;
  const searchOptions: NewsSearchOptions = {
    q: query,
    language: options.language || 'en',
    sortBy: options.sortBy || 'publishedAt',
    pageSize: Math.min(options.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    from: options.from,
    to: options.to,
    domains: options.domains,
    excludeDomains: options.excludeDomains,
  };

  // Check cache
  const cacheKey = `company:${companyName}:${buildCacheKey(searchOptions)}`;
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // API call
  const response = await apiRequest<NewsApiResponse>('/everything', {
    q: searchOptions.q,
    language: searchOptions.language,
    sortBy: searchOptions.sortBy,
    pageSize: searchOptions.pageSize,
    from: searchOptions.from,
    to: searchOptions.to,
    domains: searchOptions.domains,
    excludeDomains: searchOptions.excludeDomains,
  });

  if (!response) {
    return null;
  }

  // Enrich articles with sentiment analysis
  const enrichedArticles = response.articles.map((article) =>
    enrichArticle(article, companyName)
  );

  const result: CompanyNewsResult = {
    company: companyName,
    query,
    totalResults: response.totalResults,
    articles: enrichedArticles,
    searchedAt: new Date().toISOString(),
    fromCache: false,
  };

  setCache(searchCache, cacheKey, result);
  return result;
}

/**
 * Search for negative news about a company (breach/regulatory focus)
 */
export async function searchCompanyRisks(
  companyName: string,
  options: Partial<NewsSearchOptions> = {}
): Promise<CompanyNewsResult | null> {
  // Build query focused on negative/risk keywords
  const riskKeywords = NEGATIVE_KEYWORDS.slice(0, 10).join(' OR ');
  const query = `"${companyName}" AND (${riskKeywords})`;

  return searchCompanyNews(companyName, {
    ...options,
    q: query,
  });
}

/**
 * Get top headlines for a domain/industry
 */
export async function getTopHeadlines(
  category?: string,
  country: string = 'us'
): Promise<NewsArticle[] | null> {
  const response = await apiRequest<NewsApiResponse>('/top-headlines', {
    category: category || 'business',
    country,
    pageSize: 20,
  });

  if (!response) {
    return null;
  }

  return response.articles;
}

// =============================================================================
// ARTICLE ENRICHMENT
// =============================================================================

/**
 * Enrich a news article with sentiment and classification
 */
function enrichArticle(
  article: NewsArticle,
  companyName: string
): EnrichedNewsArticle {
  // Combine title and description for analysis
  const text = `${article.title || ''} ${article.description || ''}`;

  // Calculate sentiment
  const { score: sentimentScore, label: sentimentLabel } = calculateSentiment(text);

  // Classify alert type
  const alertType = classifyAlertType(text);

  // Calculate relevance (simple keyword matching)
  const relevanceScore = calculateRelevance(text, companyName);

  // Find matched keywords
  const matchedKeywords = findMatchedKeywords(text);

  return {
    ...article,
    sentimentScore,
    sentimentLabel,
    relevanceScore,
    matchedKeywords,
    alertType,
  };
}

/**
 * Calculate relevance score based on company name mentions
 */
function calculateRelevance(text: string, companyName: string): number {
  const lowerText = text.toLowerCase();
  const lowerCompany = companyName.toLowerCase();

  // Check for exact company name
  const exactMatch = lowerText.includes(lowerCompany);

  // Check for partial matches (company words)
  const companyWords = lowerCompany.split(/\s+/).filter((w) => w.length > 2);
  const wordMatches = companyWords.filter((word) =>
    lowerText.includes(word)
  ).length;

  if (exactMatch) {
    return 1;
  }

  if (companyWords.length > 0) {
    return wordMatches / companyWords.length;
  }

  return 0;
}

/**
 * Find keywords that matched in the text
 */
function findMatchedKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matched: string[] = [];

  // Check all keyword lists
  const allKeywords = [
    ...NEGATIVE_KEYWORDS,
  ];

  for (const keyword of allKeywords) {
    if (lowerText.includes(keyword.toLowerCase()) && !matched.includes(keyword)) {
      matched.push(keyword);
    }
  }

  return matched.slice(0, 5); // Limit to 5 keywords
}

// =============================================================================
// RESULT WRAPPERS
// =============================================================================

/**
 * Search company news with result wrapper
 */
export async function searchCompanyNewsResult(
  companyName: string,
  options: Partial<NewsSearchOptions> = {}
): Promise<NewsApiResult<CompanyNewsResult>> {
  try {
    if (!isConfigured()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'NewsAPI key not configured. Add NEWSAPI_KEY to environment.',
        },
      };
    }

    if (!companyName || companyName.trim().length < 2) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Company name must be at least 2 characters',
        },
      };
    }

    const result = await searchCompanyNews(companyName, options);

    if (!result) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to fetch news from NewsAPI',
        },
      };
    }

    return {
      success: true,
      data: result,
      cached: result.fromCache,
      cachedAt: result.fromCache
        ? searchCache.get(`company:${companyName}:${buildCacheKey(options as NewsSearchOptions)}`)?.timestamp
          ? new Date(searchCache.get(`company:${companyName}:${buildCacheKey(options as NewsSearchOptions)}`)!.timestamp).toISOString()
          : undefined
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// =============================================================================
// MOCK DATA (for development without API key)
// =============================================================================

/**
 * Generate mock news results for development
 */
export function generateMockNews(companyName: string): CompanyNewsResult {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const mockArticles: EnrichedNewsArticle[] = [
    {
      source: { id: null, name: 'TechCrunch' },
      author: 'Sarah Chen',
      title: `${companyName} announces new security certification`,
      description: `${companyName} has achieved ISO 27001 certification, demonstrating commitment to information security management.`,
      url: 'https://example.com/article1',
      urlToImage: null,
      publishedAt: now.toISOString(),
      content: null,
      sentimentScore: 0.6,
      sentimentLabel: 'positive',
      relevanceScore: 1,
      matchedKeywords: ['certification', 'compliance'],
      alertType: 'regulatory',
    },
    {
      source: { id: null, name: 'Reuters' },
      author: 'John Smith',
      title: `${companyName} reports strong Q4 earnings`,
      description: `${companyName} exceeded analyst expectations with revenue growth of 15% year-over-year.`,
      url: 'https://example.com/article2',
      urlToImage: null,
      publishedAt: yesterday.toISOString(),
      content: null,
      sentimentScore: 0.8,
      sentimentLabel: 'positive',
      relevanceScore: 1,
      matchedKeywords: ['revenue', 'growth', 'earnings'],
      alertType: 'financial',
    },
    {
      source: { id: null, name: 'CyberNews' },
      author: 'Mike Johnson',
      title: `Industry analysis: ${companyName} security posture review`,
      description: `A comprehensive look at ${companyName}'s approach to cybersecurity and data protection.`,
      url: 'https://example.com/article3',
      urlToImage: null,
      publishedAt: twoDaysAgo.toISOString(),
      content: null,
      sentimentScore: 0,
      sentimentLabel: 'neutral',
      relevanceScore: 0.8,
      matchedKeywords: [],
      alertType: 'news',
    },
  ];

  return {
    company: companyName,
    query: `"${companyName}"`,
    totalResults: mockArticles.length,
    articles: mockArticles,
    searchedAt: now.toISOString(),
    fromCache: false,
  };
}

/**
 * Get news - uses mock data if API not configured
 */
export async function searchCompanyNewsOrMock(
  companyName: string,
  options: Partial<NewsSearchOptions> = {}
): Promise<CompanyNewsResult | null> {
  if (!isConfigured()) {
    console.log('[NewsAPI] Using mock data (API not configured)');
    return generateMockNews(companyName);
  }
  return searchCompanyNews(companyName, options);
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Search news for multiple companies (with rate limiting)
 */
export async function searchMultipleCompanies(
  companyNames: string[],
  options: Partial<NewsSearchOptions> = {}
): Promise<Map<string, CompanyNewsResult | null>> {
  const results = new Map<string, CompanyNewsResult | null>();

  // Process sequentially to respect rate limits
  for (const company of companyNames) {
    const result = await searchCompanyNews(company, options);
    results.set(company, result);

    // Add delay between requests to respect rate limits
    if (companyNames.indexOf(company) < companyNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Check if there are any high-severity news items
 */
export function hasHighSeverityNews(result: CompanyNewsResult): boolean {
  return result.articles.some((article) => {
    const severity = calculateSeverity(article.sentimentLabel, article.alertType);
    return severity === 'high' || severity === 'critical';
  });
}

/**
 * Filter articles by severity
 */
export function filterBySeverity(
  articles: EnrichedNewsArticle[],
  minSeverity: 'low' | 'medium' | 'high' | 'critical'
): EnrichedNewsArticle[] {
  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);

  return articles.filter((article) => {
    const severity = calculateSeverity(article.sentimentLabel, article.alertType);
    return severityOrder.indexOf(severity) >= minIndex;
  });
}
