/**
 * GLEIF API Client
 *
 * Integration with the Global Legal Entity Identifier Foundation (GLEIF) API
 * for LEI lookup and validation.
 *
 * API Documentation: https://www.gleif.org/en/lei-data/gleif-api
 * Base URL: https://api.gleif.org/api/v1
 *
 * Rate Limits: Be respectful of GLEIF's free API - implement caching.
 */

import type { GLEIFEntity, GLEIFSearchResult } from '@/lib/vendors/types';

const GLEIF_API_BASE = 'https://api.gleif.org/api/v1';

// Cache for LEI lookups (in-memory, cleared on server restart)
const leiCache = new Map<string, { data: GLEIFEntity; timestamp: number }>();
const searchCache = new Map<string, { data: GLEIFSearchResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// ============================================
// TYPES
// ============================================

interface GLEIFAPIResponse {
  data: GLEIFAPIRecord[] | GLEIFAPIRecord;
  meta?: {
    pagination?: {
      total: number;
      pageSize: number;
      currentPage: number;
    };
  };
}

interface GLEIFAPIRecord {
  type: 'lei-records';
  id: string;
  attributes: {
    lei: string;
    entity: {
      legalName: {
        name: string;
        language?: string;
      };
      otherNames?: Array<{
        name: string;
        language?: string;
        type?: string;
      }>;
      legalAddress: {
        language?: string;
        addressLines: string[];
        city: string;
        region?: string;
        country: string;
        postalCode?: string;
      };
      headquartersAddress?: {
        language?: string;
        addressLines?: string[];
        city?: string;
        region?: string;
        country?: string;
        postalCode?: string;
      };
      registeredAt?: {
        id?: string;
        other?: string;
      };
      registeredAs?: string;
      jurisdiction?: string;
      category?: string;
      legalForm?: {
        id?: string;
        other?: string;
      };
      status?: string;
      creationDate?: string;
    };
    registration: {
      initialRegistrationDate: string;
      lastUpdateDate: string;
      status: string;
      nextRenewalDate?: string;
      managingLou: string;
      corroborationLevel?: string;
      validatedAt?: {
        id?: string;
        other?: string;
      };
      validatedAs?: string;
    };
  };
}

// ============================================
// HELPERS
// ============================================

function mapGLEIFRecord(record: GLEIFAPIRecord): GLEIFEntity {
  const { attributes } = record;
  const entity = attributes.entity;
  const registration = attributes.registration;

  return {
    lei: attributes.lei,
    legalName: entity.legalName.name,
    otherNames: entity.otherNames?.map((n) => n.name),
    legalAddress: {
      country: entity.legalAddress.country,
      city: entity.legalAddress.city,
      postalCode: entity.legalAddress.postalCode,
      addressLines: entity.legalAddress.addressLines,
    },
    headquartersAddress: entity.headquartersAddress
      ? {
          country: entity.headquartersAddress.country || entity.legalAddress.country,
          city: entity.headquartersAddress.city,
        }
      : undefined,
    registrationStatus: registration.status as GLEIFEntity['registrationStatus'],
    entityCategory: entity.category,
    legalForm: entity.legalForm?.other || entity.legalForm?.id,
  };
}

function getCacheKey(type: 'lei' | 'search', key: string): string {
  return `${type}:${key.toLowerCase().trim()}`;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Look up a specific LEI
 *
 * @param lei - The 20-character LEI to look up
 * @returns The entity data or null if not found
 */
export async function lookupLEI(lei: string): Promise<GLEIFEntity | null> {
  if (!lei || lei.length !== 20) {
    return null;
  }

  const normalizedLEI = lei.toUpperCase().trim();
  const cacheKey = getCacheKey('lei', normalizedLEI);

  // Check cache
  const cached = leiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`${GLEIF_API_BASE}/lei-records/${normalizedLEI}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.api+json',
      },
      // Cache for 24 hours on the edge
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`GLEIF API error: ${response.status}`);
    }

    const json: GLEIFAPIResponse = await response.json();
    const record = json.data as GLEIFAPIRecord;
    const entity = mapGLEIFRecord(record);

    // Cache result
    leiCache.set(cacheKey, { data: entity, timestamp: Date.now() });

    return entity;
  } catch (error) {
    console.error('GLEIF lookup error:', error);
    return null;
  }
}

/**
 * Search for entities by name
 *
 * @param query - The search query (company name)
 * @param limit - Maximum number of results (default 10, max 50)
 * @returns Search results with matching entities
 */
export async function searchEntities(
  query: string,
  limit: number = 10
): Promise<GLEIFSearchResult> {
  if (!query || query.length < 2) {
    return { total: 0, results: [] };
  }

  const normalizedQuery = query.trim();
  const cacheKey = getCacheKey('search', `${normalizedQuery}:${limit}`);

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use fuzzy name matching with GLEIF API
    const params = new URLSearchParams({
      'filter[entity.legalName]': normalizedQuery,
      'page[size]': Math.min(limit, 50).toString(),
      'page[number]': '1',
    });

    const response = await fetch(`${GLEIF_API_BASE}/lei-records?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.api+json',
      },
      // Cache for 1 hour on the edge
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`GLEIF API error: ${response.status}`);
    }

    const json: GLEIFAPIResponse = await response.json();
    const records = Array.isArray(json.data) ? json.data : [json.data];

    const result: GLEIFSearchResult = {
      total: json.meta?.pagination?.total || records.length,
      results: records.map(mapGLEIFRecord),
    };

    // Cache result
    searchCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('GLEIF search error:', error);
    return { total: 0, results: [] };
  }
}

/**
 * Autocomplete search for vendor name input
 * Returns up to 5 results for quick selection
 */
export async function autocompleteVendorName(query: string): Promise<GLEIFEntity[]> {
  if (!query || query.length < 3) {
    return [];
  }

  const result = await searchEntities(query, 5);

  // Filter to only show active entities
  return result.results.filter(
    (entity) => entity.registrationStatus === 'ISSUED'
  );
}

/**
 * Validate that an LEI is properly formatted and exists in GLEIF
 */
export async function validateLEI(
  lei: string
): Promise<{ valid: boolean; entity?: GLEIFEntity; error?: string }> {
  // Format check
  if (!lei) {
    return { valid: false, error: 'LEI is required' };
  }

  const normalizedLEI = lei.toUpperCase().trim();

  if (!/^[A-Z0-9]{20}$/.test(normalizedLEI)) {
    return { valid: false, error: 'LEI must be exactly 20 alphanumeric characters' };
  }

  // GLEIF lookup
  const entity = await lookupLEI(normalizedLEI);

  if (!entity) {
    return { valid: false, error: 'LEI not found in GLEIF database' };
  }

  if (entity.registrationStatus !== 'ISSUED') {
    return {
      valid: false,
      entity,
      error: `LEI status is ${entity.registrationStatus}, not ISSUED`,
    };
  }

  return { valid: true, entity };
}

/**
 * Get country name from ISO 3166-1 alpha-2 code
 */
export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    NL: 'Netherlands',
    IE: 'Ireland',
    ES: 'Spain',
    IT: 'Italy',
    CH: 'Switzerland',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    AT: 'Austria',
    BE: 'Belgium',
    LU: 'Luxembourg',
    PT: 'Portugal',
    GR: 'Greece',
    PL: 'Poland',
    CZ: 'Czech Republic',
    RO: 'Romania',
    HU: 'Hungary',
    JP: 'Japan',
    CN: 'China',
    HK: 'Hong Kong',
    SG: 'Singapore',
    AU: 'Australia',
    CA: 'Canada',
    BR: 'Brazil',
    IN: 'India',
    // Add more as needed
  };

  return countries[code.toUpperCase()] || code;
}

/**
 * Get country flag emoji from ISO 3166-1 alpha-2 code
 */
export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '';

  // Convert country code to flag emoji using regional indicator symbols
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
