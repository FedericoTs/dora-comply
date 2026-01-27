/**
 * Have I Been Pwned (HIBP) API Client
 *
 * Provides breach exposure checking for vendor domains.
 * Free for non-commercial use, API key required for domain search.
 *
 * API Documentation: https://haveibeenpwned.com/API/v3
 */

import {
  HIBPBreach,
  HIBPResult,
  DomainBreachResult,
  BreachSummary,
  BreachSeverity,
  calculateBreachSeverity,
  calculateOverallSeverity,
  filterRelevantBreaches,
  sortBreaches,
} from './hibp-types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const HIBP_API_BASE = 'https://haveibeenpwned.com/api/v3';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (breaches don't change often)
const RATE_LIMIT_DELAY = 1500; // 1.5s between requests (HIBP rate limit)

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const domainCache = new Map<string, CacheEntry<DomainBreachResult>>();
const allBreachesCache: CacheEntry<HIBPBreach[]> | null = null;
let lastRequestTime = 0;

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
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
 * Clear all caches
 */
export function clearCache(): void {
  domainCache.clear();
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Check if HIBP API key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.HIBP_API_KEY;
}

/**
 * Get API key (throws if not configured)
 */
function getApiKey(): string {
  const key = process.env.HIBP_API_KEY;
  if (!key) {
    throw new Error('HIBP_API_KEY environment variable not set');
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
 * Rate-limited API request
 */
async function apiRequest<T>(endpoint: string): Promise<T | null> {
  try {
    // Respect rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();

    const apiKey = getApiKey();
    const url = `${HIBP_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'hibp-api-key': apiKey,
        'User-Agent': 'ComplianceApp-TPRM',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // 24 hours edge cache
    });

    if (response.status === 404) {
      // No breaches found - this is a good thing!
      return null;
    }

    if (response.status === 401) {
      console.error('[HIBP] Authentication failed - check API key');
      return null;
    }

    if (response.status === 429) {
      console.error('[HIBP] Rate limit exceeded - waiting');
      // Wait and retry once
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY * 2));
      return apiRequest(endpoint);
    }

    if (!response.ok) {
      console.error(`[HIBP] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[HIBP] Request failed:', error);
    return null;
  }
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Get all known breaches (public endpoint, no API key needed)
 */
export async function getAllBreaches(): Promise<HIBPBreach[]> {
  // Check cache
  if (allBreachesCache && Date.now() - allBreachesCache.timestamp < CACHE_TTL) {
    return allBreachesCache.data;
  }

  try {
    const response = await fetch(`${HIBP_API_BASE}/breaches`, {
      headers: {
        'User-Agent': 'ComplianceApp-TPRM',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      console.error(`[HIBP] Failed to get breaches: ${response.status}`);
      return [];
    }

    const breaches: HIBPBreach[] = await response.json();
    return filterRelevantBreaches(breaches);
  } catch (error) {
    console.error('[HIBP] Failed to get all breaches:', error);
    return [];
  }
}

/**
 * Check if a domain has been involved in breaches
 * Note: This searches against known breach domains, not email domains
 */
export async function checkDomainBreaches(
  domain: string
): Promise<DomainBreachResult | null> {
  const normalizedDomain = normalizeDomain(domain);

  // Check cache
  const cached = getCached(domainCache, normalizedDomain);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Get all breaches and filter by domain
  const allBreaches = await getAllBreaches();
  const domainBreaches = allBreaches.filter(
    (b) => b.Domain.toLowerCase() === normalizedDomain
  );

  // Convert to summary format
  const breachSummaries: BreachSummary[] = domainBreaches.map((breach) => ({
    name: breach.Title,
    domain: breach.Domain,
    breachDate: breach.BreachDate,
    pwnCount: breach.PwnCount,
    dataClasses: breach.DataClasses,
    severity: calculateBreachSeverity(breach.DataClasses, breach.PwnCount),
    isVerified: breach.IsVerified,
  }));

  // Sort by severity and date
  const sortedBreaches = sortBreaches(breachSummaries);

  // Calculate totals
  const totalPwned = domainBreaches.reduce((sum, b) => sum + b.PwnCount, 0);
  const overallSeverity = calculateOverallSeverity(sortedBreaches);

  const result: DomainBreachResult = {
    domain: normalizedDomain,
    breachCount: sortedBreaches.length,
    totalPwned,
    breaches: sortedBreaches,
    severity: overallSeverity,
    checkedAt: new Date().toISOString(),
    fromCache: false,
  };

  setCache(domainCache, normalizedDomain, result);
  return result;
}

/**
 * Check multiple domains for breaches (with rate limiting)
 */
export async function checkMultipleDomains(
  domains: string[]
): Promise<Map<string, DomainBreachResult | null>> {
  const results = new Map<string, DomainBreachResult | null>();

  // Get all breaches once
  const allBreaches = await getAllBreaches();

  for (const domain of domains) {
    const normalizedDomain = normalizeDomain(domain);

    // Check cache first
    const cached = getCached(domainCache, normalizedDomain);
    if (cached) {
      results.set(domain, { ...cached, fromCache: true });
      continue;
    }

    // Filter breaches for this domain
    const domainBreaches = allBreaches.filter(
      (b) => b.Domain.toLowerCase() === normalizedDomain
    );

    const breachSummaries: BreachSummary[] = domainBreaches.map((breach) => ({
      name: breach.Title,
      domain: breach.Domain,
      breachDate: breach.BreachDate,
      pwnCount: breach.PwnCount,
      dataClasses: breach.DataClasses,
      severity: calculateBreachSeverity(breach.DataClasses, breach.PwnCount),
      isVerified: breach.IsVerified,
    }));

    const sortedBreaches = sortBreaches(breachSummaries);
    const totalPwned = domainBreaches.reduce((sum, b) => sum + b.PwnCount, 0);
    const overallSeverity = calculateOverallSeverity(sortedBreaches);

    const result: DomainBreachResult = {
      domain: normalizedDomain,
      breachCount: sortedBreaches.length,
      totalPwned,
      breaches: sortedBreaches,
      severity: overallSeverity,
      checkedAt: new Date().toISOString(),
      fromCache: false,
    };

    setCache(domainCache, normalizedDomain, result);
    results.set(domain, result);
  }

  return results;
}

// =============================================================================
// RESULT WRAPPERS
// =============================================================================

/**
 * Check domain breaches with result wrapper
 */
export async function checkDomainBreachesResult(
  domain: string
): Promise<HIBPResult<DomainBreachResult>> {
  try {
    if (!domain || domain.trim().length < 3) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Domain must be at least 3 characters',
        },
      };
    }

    const result = await checkDomainBreaches(domain);

    // No result means no breaches found
    if (!result) {
      return {
        success: true,
        data: {
          domain: normalizeDomain(domain),
          breachCount: 0,
          totalPwned: 0,
          breaches: [],
          severity: 'low' as BreachSeverity,
          checkedAt: new Date().toISOString(),
          fromCache: false,
        },
      };
    }

    return {
      success: true,
      data: result,
      cached: result.fromCache,
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
// MOCK DATA
// =============================================================================

/**
 * Generate mock breach data for development
 */
export function generateMockBreachData(domain: string): DomainBreachResult {
  const normalizedDomain = normalizeDomain(domain);

  // Simulate no breaches for most domains
  const hasBreaches = Math.random() > 0.7;

  if (!hasBreaches) {
    return {
      domain: normalizedDomain,
      breachCount: 0,
      totalPwned: 0,
      breaches: [],
      severity: 'low',
      checkedAt: new Date().toISOString(),
      fromCache: false,
    };
  }

  // Generate mock breaches
  const mockBreaches: BreachSummary[] = [
    {
      name: 'Sample Data Breach',
      domain: normalizedDomain,
      breachDate: '2023-06-15',
      pwnCount: 250000,
      dataClasses: ['Email addresses', 'Passwords', 'Usernames'],
      severity: 'high',
      isVerified: true,
    },
  ];

  return {
    domain: normalizedDomain,
    breachCount: mockBreaches.length,
    totalPwned: mockBreaches.reduce((sum, b) => sum + b.pwnCount, 0),
    breaches: mockBreaches,
    severity: 'high',
    checkedAt: new Date().toISOString(),
    fromCache: false,
  };
}

/**
 * Check domain or return mock data
 */
export async function checkDomainBreachesOrMock(
  domain: string
): Promise<DomainBreachResult> {
  // Always use mock data since HIBP API key is optional
  const result = await checkDomainBreaches(domain);

  if (result) {
    return result;
  }

  console.log('[HIBP] Using mock data');
  return generateMockBreachData(domain);
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if domain has any breaches
 */
export async function hasBreaches(domain: string): Promise<boolean> {
  const result = await checkDomainBreaches(domain);
  return (result?.breachCount || 0) > 0;
}

/**
 * Get breach severity for a domain
 */
export async function getDomainSeverity(
  domain: string
): Promise<BreachSeverity> {
  const result = await checkDomainBreaches(domain);
  return result?.severity || 'low';
}

/**
 * Get breach count for a domain
 */
export async function getBreachCount(domain: string): Promise<number> {
  const result = await checkDomainBreaches(domain);
  return result?.breachCount || 0;
}

/**
 * Find well-known breached companies (for reference/comparison)
 */
export async function getNotableBreaches(
  limit: number = 10
): Promise<HIBPBreach[]> {
  const allBreaches = await getAllBreaches();

  // Sort by pwn count (largest breaches first)
  return allBreaches
    .sort((a, b) => b.PwnCount - a.PwnCount)
    .slice(0, limit);
}
