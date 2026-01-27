/**
 * SEC EDGAR API Client
 *
 * Provides access to US company SEC filings for business intelligence.
 * Free API - no authentication required.
 *
 * Endpoints used:
 * - Company search: https://www.sec.gov/cgi-bin/browse-edgar
 * - Filings API: https://data.sec.gov/submissions/CIK{cik}.json
 * - Full-text search: https://efts.sec.gov/LATEST/search-index
 */

import {
  SECCompany,
  SECFiling,
  SECFilingsResult,
  SECResult,
  SECCompanySearchResult,
  FilingSearchOptions,
  SECFormType,
  RISK_RELEVANT_FORMS,
  formatCik,
  buildDocumentUrl,
} from './sec-edgar-types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SEC_DATA_API = 'https://data.sec.gov';
const SEC_EFTS_API = 'https://efts.sec.gov/LATEST';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const USER_AGENT = 'ComplianceApp contact@example.com'; // SEC requires user agent

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const companyCache = new Map<string, CacheEntry<SECCompany>>();
const filingsCache = new Map<string, CacheEntry<SECFilingsResult>>();
const searchCache = new Map<string, CacheEntry<SECCompanySearchResult[]>>();

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
  companyCache.clear();
  filingsCache.clear();
  searchCache.clear();
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Make API request to SEC
 */
async function apiRequest<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      next: { revalidate: 14400 }, // 4 hours edge cache
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 429) {
      console.error('[SEC EDGAR] Rate limited - slow down requests');
      return null;
    }

    if (!response.ok) {
      console.error(
        `[SEC EDGAR] API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[SEC EDGAR] Request failed:', error);
    return null;
  }
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Get company information and filings by CIK
 */
export async function getCompanyByCik(cik: string): Promise<SECCompany | null> {
  const formattedCik = formatCik(cik);

  // Check cache
  const cached = getCached(companyCache, formattedCik);
  if (cached) {
    return cached;
  }

  // Fetch from SEC data API
  const url = `${SEC_DATA_API}/submissions/CIK${formattedCik}.json`;
  const response = await apiRequest<{
    cik: string;
    name: string;
    tickers?: string[];
    exchanges?: string[];
    sic?: string;
    sicDescription?: string;
    stateOfIncorporation?: string;
    fiscalYearEnd?: string;
    filings?: {
      recent: {
        accessionNumber: string[];
        filingDate: string[];
        form: string[];
        primaryDocument?: string[];
        primaryDocDescription?: string[];
        items?: string[];
      };
    };
  }>(url);

  if (!response) {
    return null;
  }

  // Parse filings
  const filings: SECFiling[] = [];
  const recent = response.filings?.recent;

  if (recent) {
    const count = Math.min(recent.accessionNumber.length, 100); // Limit to 100 filings
    for (let i = 0; i < count; i++) {
      const accessionNumber = recent.accessionNumber[i];
      const primaryDoc = recent.primaryDocument?.[i];

      filings.push({
        accessionNumber,
        cik: formatCik(response.cik),
        form: recent.form[i] as SECFormType,
        filedAt: recent.filingDate[i],
        primaryDocument: primaryDoc,
        primaryDocUrl: primaryDoc
          ? buildDocumentUrl(response.cik, accessionNumber, primaryDoc)
          : undefined,
        filingUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${response.cik}&type=&dateb=&owner=include&count=40`,
        items: recent.items?.[i]?.split(',').map((s) => s.trim()) || [],
      });
    }
  }

  const company: SECCompany = {
    cik: formatCik(response.cik),
    name: response.name,
    ticker: response.tickers?.[0],
    exchange: response.exchanges?.[0],
    sicCode: response.sic,
    sicDescription: response.sicDescription,
    stateOfIncorporation: response.stateOfIncorporation,
    fiscalYearEnd: response.fiscalYearEnd,
    filings,
  };

  setCache(companyCache, formattedCik, company);
  return company;
}

/**
 * Search for companies by name
 */
export async function searchCompanies(
  query: string,
  limit: number = 10
): Promise<SECCompanySearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}:${limit}`;

  // Check cache
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    return cached;
  }

  // Use full-text search API
  const url = `${SEC_EFTS_API}/search-index?q=${encodeURIComponent(query)}&dateRange=custom&startdt=2020-01-01&enddt=2030-12-31&forms=10-K&page=1&from=0`;

  const response = await apiRequest<{
    hits?: {
      hits?: Array<{
        _source?: {
          ciks?: string[];
          display_names?: string[];
          tickers?: string[];
        };
      }>;
    };
  }>(url);

  if (!response?.hits?.hits) {
    return [];
  }

  // Extract unique companies
  const companiesMap = new Map<string, SECCompanySearchResult>();

  for (const hit of response.hits.hits) {
    const source = hit._source;
    if (source?.ciks && source?.display_names) {
      for (let i = 0; i < source.ciks.length && i < source.display_names.length; i++) {
        const cik = source.ciks[i];
        if (!companiesMap.has(cik)) {
          companiesMap.set(cik, {
            cik: formatCik(cik),
            name: source.display_names[i],
            ticker: source.tickers?.[i],
          });
        }
      }
    }
  }

  const results = Array.from(companiesMap.values()).slice(0, limit);
  setCache(searchCache, cacheKey, results);
  return results;
}

/**
 * Get recent filings for a company
 */
export async function getRecentFilings(
  cik: string,
  options: Partial<FilingSearchOptions> = {}
): Promise<SECFilingsResult | null> {
  const formattedCik = formatCik(cik);
  const cacheKey = `filings:${formattedCik}:${JSON.stringify(options)}`;

  // Check cache
  const cached = getCached(filingsCache, cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Get company data
  const company = await getCompanyByCik(cik);
  if (!company) {
    return null;
  }

  // Filter filings
  let filings = company.filings || [];

  // Filter by form type
  if (options.forms && options.forms.length > 0) {
    filings = filings.filter((f) => options.forms!.includes(f.form as SECFormType));
  }

  // Filter by date range
  if (options.from) {
    filings = filings.filter((f) => f.filedAt >= options.from!);
  }
  if (options.to) {
    filings = filings.filter((f) => f.filedAt <= options.to!);
  }

  // Apply limit
  if (options.limit) {
    filings = filings.slice(0, options.limit);
  }

  const result: SECFilingsResult = {
    company,
    filings,
    totalFilings: filings.length,
    searchedAt: new Date().toISOString(),
    fromCache: false,
  };

  setCache(filingsCache, cacheKey, result);
  return result;
}

/**
 * Get risk-relevant filings (10-K, 10-Q, 8-K)
 */
export async function getRiskRelevantFilings(
  cik: string,
  limit: number = 20
): Promise<SECFilingsResult | null> {
  return getRecentFilings(cik, {
    forms: RISK_RELEVANT_FORMS,
    limit,
  });
}

/**
 * Search for company by name and get filings
 */
export async function searchAndGetFilings(
  companyName: string,
  options: Partial<FilingSearchOptions> = {}
): Promise<SECFilingsResult | null> {
  // Search for company
  const companies = await searchCompanies(companyName, 1);

  if (companies.length === 0) {
    return null;
  }

  // Get filings for first match
  return getRecentFilings(companies[0].cik, options);
}

// =============================================================================
// RESULT WRAPPERS
// =============================================================================

/**
 * Get filings with result wrapper
 */
export async function getFilingsResult(
  cik: string,
  options: Partial<FilingSearchOptions> = {}
): Promise<SECResult<SECFilingsResult>> {
  try {
    if (!cik || cik.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'CIK is required',
        },
      };
    }

    const result = await getRecentFilings(cik, options);

    if (!result) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No company found for CIK: ${cik}`,
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

/**
 * Search company and get filings with result wrapper
 */
export async function searchFilingsResult(
  companyName: string,
  options: Partial<FilingSearchOptions> = {}
): Promise<SECResult<SECFilingsResult>> {
  try {
    if (!companyName || companyName.trim().length < 2) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Company name must be at least 2 characters',
        },
      };
    }

    const result = await searchAndGetFilings(companyName, options);

    if (!result) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No SEC filings found for: ${companyName}`,
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
 * Generate mock SEC filings for development
 */
export function generateMockFilings(companyName: string): SECFilingsResult {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const nineMonthsAgo = new Date(now.getTime() - 270 * 24 * 60 * 60 * 1000);

  const mockFilings: SECFiling[] = [
    {
      accessionNumber: '0001234567-24-000001',
      cik: '0001234567',
      form: '10-K',
      filedAt: threeMonthsAgo.toISOString().split('T')[0],
      primaryDocument: 'form10k.htm',
      filingUrl: 'https://www.sec.gov/example',
      description: 'Annual Report',
    },
    {
      accessionNumber: '0001234567-24-000002',
      cik: '0001234567',
      form: '10-Q',
      filedAt: sixMonthsAgo.toISOString().split('T')[0],
      primaryDocument: 'form10q.htm',
      filingUrl: 'https://www.sec.gov/example',
      description: 'Quarterly Report',
    },
    {
      accessionNumber: '0001234567-24-000003',
      cik: '0001234567',
      form: '8-K',
      filedAt: nineMonthsAgo.toISOString().split('T')[0],
      primaryDocument: 'form8k.htm',
      filingUrl: 'https://www.sec.gov/example',
      description: 'Current Report',
      items: ['5.02', '9.01'],
    },
  ];

  const mockCompany: SECCompany = {
    cik: '0001234567',
    name: companyName,
    ticker: companyName.substring(0, 4).toUpperCase(),
    exchange: 'NYSE',
    sicCode: '7372',
    sicDescription: 'Prepackaged Software',
    stateOfIncorporation: 'DE',
    fiscalYearEnd: '1231',
    filings: mockFilings,
  };

  return {
    company: mockCompany,
    filings: mockFilings,
    totalFilings: mockFilings.length,
    searchedAt: new Date().toISOString(),
    fromCache: false,
  };
}

/**
 * Get filings or mock data
 */
export async function getFilingsOrMock(
  companyName: string,
  options: Partial<FilingSearchOptions> = {}
): Promise<SECFilingsResult | null> {
  // Try real API first
  const result = await searchAndGetFilings(companyName, options);

  if (result) {
    return result;
  }

  // Fall back to mock data
  console.log('[SEC EDGAR] Using mock data (company not found or API error)');
  return generateMockFilings(companyName);
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Check if company has SEC filings
 */
export async function hasFilings(companyNameOrCik: string): Promise<boolean> {
  // Try as CIK first
  if (/^\d+$/.test(companyNameOrCik.replace(/^0+/, ''))) {
    const company = await getCompanyByCik(companyNameOrCik);
    return company !== null && (company.filings?.length || 0) > 0;
  }

  // Search by name
  const companies = await searchCompanies(companyNameOrCik, 1);
  return companies.length > 0;
}

/**
 * Get latest filing of a specific type
 */
export async function getLatestFiling(
  cik: string,
  formType: SECFormType
): Promise<SECFiling | null> {
  const result = await getRecentFilings(cik, {
    forms: [formType],
    limit: 1,
  });

  return result?.filings[0] || null;
}

/**
 * Get count of filings by type
 */
export async function getFilingCounts(
  cik: string
): Promise<Record<string, number> | null> {
  const company = await getCompanyByCik(cik);
  if (!company?.filings) return null;

  const counts: Record<string, number> = {};
  for (const filing of company.filings) {
    counts[filing.form] = (counts[filing.form] || 0) + 1;
  }
  return counts;
}
