/**
 * SEC-API.io Integration (Premium)
 *
 * Enhanced SEC filings API with full-text search and real-time data.
 * Requires API key from https://sec-api.io
 *
 * This is an OPTIONAL enhancement - falls back to free SEC EDGAR if not configured.
 */

import {
  SECCompany,
  SECFiling,
  SECFilingsResult,
  SECFormType,
  RISK_RELEVANT_FORMS,
} from './sec-edgar-types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SEC_API_BASE = 'https://api.sec-api.io';
const QUERY_API = 'https://api.sec-api.io';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<SECFilingsResult>>();

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key);
  }
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Check if SEC-API.io is configured
 */
export function isSecApiConfigured(): boolean {
  return !!process.env.SEC_API_KEY;
}

/**
 * Get API key
 */
function getApiKey(): string | null {
  return process.env.SEC_API_KEY || null;
}

/**
 * Query SEC filings using sec-api.io Query API
 *
 * @see https://sec-api.io/docs/query-api
 */
export async function queryFilings(options: {
  companyName?: string;
  cik?: string;
  ticker?: string;
  formTypes?: SECFormType[];
  from?: string;
  to?: string;
  limit?: number;
}): Promise<SECFilingsResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('[SEC-API.io] Not configured - use free SEC EDGAR instead');
    return null;
  }

  const cacheKey = `query:${JSON.stringify(options)}`;
  const cached = getCached(queryCache, cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  try {
    // Build query
    const query: Record<string, unknown> = {
      query: {
        query_string: {
          query: buildQueryString(options),
        },
      },
      from: '0',
      size: String(options.limit || 20),
      sort: [{ filedAt: { order: 'desc' } }],
    };

    const response = await fetch(QUERY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[SEC-API.io] Invalid API key');
      } else if (response.status === 429) {
        console.error('[SEC-API.io] Rate limited');
      } else {
        console.error(`[SEC-API.io] API error: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();
    const result = parseQueryResponse(data, options);

    if (result) {
      setCache(queryCache, cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('[SEC-API.io] Request failed:', error);
    return null;
  }
}

/**
 * Build Elasticsearch query string for sec-api.io
 */
function buildQueryString(options: {
  companyName?: string;
  cik?: string;
  ticker?: string;
  formTypes?: SECFormType[];
  from?: string;
  to?: string;
}): string {
  const parts: string[] = [];

  if (options.cik) {
    // Pad CIK to 10 digits
    const paddedCik = options.cik.replace(/^0+/, '').padStart(10, '0');
    parts.push(`cik:"${paddedCik}"`);
  }

  if (options.ticker) {
    parts.push(`ticker:"${options.ticker}"`);
  }

  if (options.companyName) {
    parts.push(`companyName:"${options.companyName}"`);
  }

  if (options.formTypes && options.formTypes.length > 0) {
    const formQuery = options.formTypes.map(f => `"${f}"`).join(' OR ');
    parts.push(`formType:(${formQuery})`);
  }

  if (options.from || options.to) {
    const fromDate = options.from || '2000-01-01';
    const toDate = options.to || new Date().toISOString().split('T')[0];
    parts.push(`filedAt:[${fromDate} TO ${toDate}]`);
  }

  return parts.length > 0 ? parts.join(' AND ') : '*';
}

/**
 * Parse sec-api.io query response
 */
function parseQueryResponse(
  data: {
    filings?: Array<{
      id?: string;
      accessionNo?: string;
      cik?: string;
      ticker?: string;
      companyName?: string;
      companyNameLong?: string;
      formType?: string;
      description?: string;
      filedAt?: string;
      linkToTxt?: string;
      linkToHtml?: string;
      linkToFilingDetails?: string;
      items?: string[];
    }>;
    total?: { value?: number };
  },
  options: { companyName?: string; cik?: string }
): SECFilingsResult | null {
  if (!data.filings || data.filings.length === 0) {
    return null;
  }

  const filings: SECFiling[] = data.filings.map((f) => ({
    accessionNumber: f.accessionNo || f.id || '',
    cik: f.cik || '',
    form: (f.formType || 'OTHER') as SECFormType,
    filedAt: f.filedAt?.split('T')[0] || '',
    primaryDocument: f.linkToHtml?.split('/').pop(),
    primaryDocUrl: f.linkToHtml,
    filingUrl: f.linkToFilingDetails || f.linkToHtml || '',
    description: f.description,
    items: f.items,
  }));

  const firstFiling = data.filings[0];
  const company: SECCompany = {
    cik: firstFiling.cik || options.cik || '',
    name: firstFiling.companyNameLong || firstFiling.companyName || options.companyName || '',
    ticker: firstFiling.ticker,
    filings,
  };

  return {
    company,
    filings,
    totalFilings: data.total?.value || filings.length,
    searchedAt: new Date().toISOString(),
    fromCache: false,
  };
}

/**
 * Search filings by company name with sec-api.io
 */
export async function searchByCompanyName(
  companyName: string,
  options: { limit?: number; formTypes?: SECFormType[] } = {}
): Promise<SECFilingsResult | null> {
  return queryFilings({
    companyName,
    formTypes: options.formTypes || RISK_RELEVANT_FORMS,
    limit: options.limit || 20,
  });
}

/**
 * Get filings by CIK with sec-api.io
 */
export async function getFilingsByCik(
  cik: string,
  options: { limit?: number; formTypes?: SECFormType[] } = {}
): Promise<SECFilingsResult | null> {
  return queryFilings({
    cik,
    formTypes: options.formTypes || RISK_RELEVANT_FORMS,
    limit: options.limit || 20,
  });
}

/**
 * Get risk-relevant filings (10-K, 10-Q, 8-K) with sec-api.io
 */
export async function getRiskFilings(
  cikOrName: string,
  limit: number = 20
): Promise<SECFilingsResult | null> {
  // Determine if input is CIK or company name
  const isCik = /^\d+$/.test(cikOrName.replace(/^0+/, ''));

  if (isCik) {
    return getFilingsByCik(cikOrName, {
      formTypes: RISK_RELEVANT_FORMS,
      limit,
    });
  }

  return searchByCompanyName(cikOrName, {
    formTypes: RISK_RELEVANT_FORMS,
    limit,
  });
}

/**
 * Full-text search in SEC filings
 *
 * @see https://sec-api.io/docs/full-text-search-api
 */
export async function fullTextSearch(
  searchTerms: string,
  options: {
    formTypes?: SECFormType[];
    limit?: number;
  } = {}
): Promise<SECFilingsResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const query = {
      query: searchTerms,
      formTypes: options.formTypes || RISK_RELEVANT_FORMS,
      startDate: '2020-01-01',
      endDate: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(`${SEC_API_BASE}/full-text-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return parseQueryResponse(data, {});
  } catch (error) {
    console.error('[SEC-API.io] Full-text search failed:', error);
    return null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const secApiIo = {
  isConfigured: isSecApiConfigured,
  queryFilings,
  searchByCompanyName,
  getFilingsByCik,
  getRiskFilings,
  fullTextSearch,
};
