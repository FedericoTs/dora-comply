/**
 * SecurityScorecard API Client
 *
 * Provides continuous monitoring integration with SecurityScorecard
 * for external cyber risk ratings of vendors.
 *
 * Following the GLEIF integration pattern for consistency.
 */

import {
  SSCScorecard,
  SSCCompany,
  SSCFactor,
  SSCFactorName,
  SSCHistoryEntry,
  SSCGrade,
  SSCResult,
  scoreToGrade,
} from './securityscorecard-types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SSC_API_BASE = 'https://api.securityscorecard.io';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours (scores update daily)

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for API responses
const scorecardCache = new Map<string, CacheEntry<SSCScorecard>>();
const companyCache = new Map<string, CacheEntry<SSCCompany>>();
const historyCache = new Map<string, CacheEntry<SSCHistoryEntry[]>>();

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
  scorecardCache.clear();
  companyCache.clear();
  historyCache.clear();
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Check if SecurityScorecard API key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.SECURITYSCORECARD_API_KEY;
}

/**
 * Get API key (throws if not configured)
 */
function getApiKey(): string {
  const key = process.env.SECURITYSCORECARD_API_KEY;
  if (!key) {
    throw new Error('SECURITYSCORECARD_API_KEY environment variable not set');
  }
  return key;
}

/**
 * Normalize domain for consistent caching
 */
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * Make authenticated API request to SecurityScorecard
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const apiKey = getApiKey();
    const url = `${SSC_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: { revalidate: 14400 }, // 4 hours edge cache
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      console.error('[SecurityScorecard] Authentication failed - check API key');
      return null;
    }

    if (response.status === 429) {
      console.error('[SecurityScorecard] Rate limit exceeded');
      return null;
    }

    if (!response.ok) {
      console.error(
        `[SecurityScorecard] API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[SecurityScorecard] Request failed:', error);
    return null;
  }
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Lookup company information by domain
 */
export async function lookupCompany(
  domain: string
): Promise<SSCCompany | null> {
  const normalizedDomain = normalizeDomain(domain);

  // Check cache
  const cached = getCached(companyCache, normalizedDomain);
  if (cached) {
    return cached;
  }

  // API call
  const response = await apiRequest<{
    domain: string;
    name: string;
    industry: string;
    size?: string;
    headquarters?: { country: string; city?: string };
  }>(`/companies/${normalizedDomain}`);

  if (!response) {
    return null;
  }

  const company: SSCCompany = {
    domain: response.domain || normalizedDomain,
    name: response.name || normalizedDomain,
    industry: response.industry || 'Unknown',
    size: response.size,
    headquarters: response.headquarters,
  };

  setCache(companyCache, normalizedDomain, company);
  return company;
}

/**
 * Get full scorecard for a domain
 */
export async function getScorecard(
  domain: string
): Promise<SSCScorecard | null> {
  const normalizedDomain = normalizeDomain(domain);

  // Check cache
  const cached = getCached(scorecardCache, normalizedDomain);
  if (cached) {
    return cached;
  }

  // API call for score
  const response = await apiRequest<{
    domain: string;
    name: string;
    score: number;
    grade: string;
    industry: string;
    industry_average?: number;
    size?: string;
    last_score_change_date?: string;
  }>(`/companies/${normalizedDomain}`);

  if (!response) {
    return null;
  }

  // Fetch factors separately
  const factors = await getFactorScores(normalizedDomain);

  const scorecard: SSCScorecard = {
    domain: response.domain || normalizedDomain,
    name: response.name || normalizedDomain,
    score: response.score ?? 0,
    grade: (response.grade as SSCGrade) || scoreToGrade(response.score ?? 0),
    industry: response.industry || 'Unknown',
    industryAverage: response.industry_average,
    size: response.size as SSCScorecard['size'],
    factors: factors || [],
    lastUpdated:
      response.last_score_change_date || new Date().toISOString(),
  };

  setCache(scorecardCache, normalizedDomain, scorecard);
  return scorecard;
}

/**
 * Get factor scores breakdown for a domain
 */
export async function getFactorScores(
  domain: string
): Promise<SSCFactor[] | null> {
  const normalizedDomain = normalizeDomain(domain);

  const response = await apiRequest<{
    entries: Array<{
      name: string;
      score: number;
      grade: string;
      issue_count?: number;
    }>;
  }>(`/companies/${normalizedDomain}/factors`);

  if (!response?.entries) {
    return null;
  }

  return response.entries.map((factor) => ({
    name: factor.name as SSCFactor['name'],
    score: factor.score ?? 0,
    grade: (factor.grade as SSCGrade) || scoreToGrade(factor.score ?? 0),
    issueCount: factor.issue_count ?? 0,
  }));
}

/**
 * Get historical scores for trending
 */
export async function getHistoricalScores(
  domain: string,
  days: number = 90
): Promise<SSCHistoryEntry[] | null> {
  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `${normalizedDomain}:${days}`;

  // Check cache
  const cached = getCached(historyCache, cacheKey);
  if (cached) {
    return cached;
  }

  // Calculate date range
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const response = await apiRequest<{
    entries: Array<{
      date: string;
      score: number;
    }>;
  }>(`/companies/${normalizedDomain}/history/score?from=${from}&to=${to}`);

  if (!response?.entries) {
    return null;
  }

  const history: SSCHistoryEntry[] = response.entries.map((entry) => ({
    date: entry.date,
    score: entry.score,
    grade: scoreToGrade(entry.score),
  }));

  setCache(historyCache, cacheKey, history);
  return history;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if a domain has a scorecard available
 */
export async function hasScorecard(domain: string): Promise<boolean> {
  const company = await lookupCompany(domain);
  return company !== null;
}

/**
 * Get just the score and grade for a domain
 */
export async function getQuickScore(
  domain: string
): Promise<{ score: number; grade: SSCGrade } | null> {
  const scorecard = await getScorecard(domain);
  if (!scorecard) return null;

  return {
    score: scorecard.score,
    grade: scorecard.grade,
  };
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(normalizeDomain(domain));
}

// =============================================================================
// RESULT WRAPPERS (for consistent error handling)
// =============================================================================

/**
 * Get scorecard with result wrapper
 */
export async function getScorecardResult(
  domain: string
): Promise<SSCResult<SSCScorecard>> {
  try {
    if (!isConfigured()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'SecurityScorecard API key not configured',
        },
      };
    }

    if (!isValidDomain(domain)) {
      return {
        success: false,
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid domain format',
        },
      };
    }

    const normalizedDomain = normalizeDomain(domain);

    // Check if cached
    const cached = getCached(scorecardCache, normalizedDomain);
    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true,
        cachedAt: new Date(
          scorecardCache.get(normalizedDomain)!.timestamp
        ).toISOString(),
      };
    }

    const scorecard = await getScorecard(domain);

    if (!scorecard) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No scorecard found for domain: ${domain}`,
        },
      };
    }

    return {
      success: true,
      data: scorecard,
      cached: false,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// =============================================================================
// MOCK DATA (for development without API key)
// =============================================================================

/**
 * Generate mock scorecard for development/testing
 */
export function generateMockScorecard(domain: string): SSCScorecard {
  const score = Math.floor(Math.random() * 40) + 60; // 60-100

  const factorNames: SSCFactorName[] = [
    'network_security',
    'dns_health',
    'patching_cadence',
    'endpoint_security',
    'ip_reputation',
    'application_security',
    'cubit_score',
    'hacker_chatter',
    'leaked_credentials',
    'social_engineering',
  ];

  const factors: SSCFactor[] = factorNames.map((name) => {
    const factorScore = Math.min(100, Math.max(0, score + Math.floor(Math.random() * 10) - 5));
    return {
      name,
      score: factorScore,
      grade: scoreToGrade(factorScore),
      issueCount: name === 'cubit_score' ? 0 : Math.floor(Math.random() * 5),
    };
  });

  return {
    domain: normalizeDomain(domain),
    name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
    score,
    grade: scoreToGrade(score),
    industry: 'Technology',
    industryAverage: 75,
    factors,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get scorecard - uses mock data if API not configured
 */
export async function getScorecardOrMock(
  domain: string
): Promise<SSCScorecard | null> {
  if (!isConfigured()) {
    console.log('[SecurityScorecard] Using mock data (API not configured)');
    return generateMockScorecard(domain);
  }
  return getScorecard(domain);
}
