/**
 * GLEIF API Client
 *
 * Integration with the Global Legal Entity Identifier Foundation (GLEIF) API
 * for LEI lookup and validation.
 *
 * API Documentation: https://www.gleif.org/en/lei-data/gleif-api
 * Base URL: https://api.gleif.org/api/v1
 *
 * Rate Limits: 60 requests per minute (free API)
 *
 * Capabilities:
 * - Level 1: Entity data (name, address, registration)
 * - Level 2: Relationship data (parent companies via direct-parent, ultimate-parent)
 */

import type { GLEIFEntity, GLEIFSearchResult, GLEIFEnrichedEntity, GLEIFParentEntity } from '@/lib/vendors/types';

const GLEIF_API_BASE = 'https://api.gleif.org/api/v1';

// Cache for LEI lookups (in-memory, cleared on server restart)
const leiCache = new Map<string, { data: GLEIFEntity; timestamp: number }>();
const enrichedCache = new Map<string, { data: GLEIFEnrichedEntity; timestamp: number }>();
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

/**
 * GLEIF Level 2 Relationship Response (parent lookups)
 */
interface GLEIFRelationshipResponse {
  data: GLEIFRelationshipRecord[] | null;
}

interface GLEIFRelationshipRecord {
  type: 'rr-level1s' | 'relationship-records';
  id: string;
  attributes: {
    relationship: {
      type: 'IS_DIRECTLY_CONSOLIDATED_BY' | 'IS_ULTIMATELY_CONSOLIDATED_BY';
      status: 'ACTIVE' | 'INACTIVE' | 'NULL';
      startDate?: string;
      endDate?: string;
    };
    registration: {
      status: string;
      initialRegistrationDate: string;
      lastUpdateDate: string;
    };
  };
  relationships?: {
    'related-entity'?: {
      data: {
        type: string;
        id: string; // This is the parent LEI
      };
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
      region: entity.legalAddress.region,
      postalCode: entity.legalAddress.postalCode,
      addressLines: entity.legalAddress.addressLines,
    },
    headquartersAddress: entity.headquartersAddress
      ? {
          country: entity.headquartersAddress.country || entity.legalAddress.country,
          city: entity.headquartersAddress.city,
          region: entity.headquartersAddress.region,
          postalCode: entity.headquartersAddress.postalCode,
          addressLines: entity.headquartersAddress.addressLines,
        }
      : undefined,
    registrationStatus: registration.status as GLEIFEntity['registrationStatus'],
    entityCategory: entity.category,
    legalForm: entity.legalForm?.other || entity.legalForm?.id,
  };
}

/**
 * Map GLEIF record to full entity with all ESA-required fields
 */
function mapGLEIFRecordFull(record: GLEIFAPIRecord): GLEIFEnrichedEntity {
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
      region: entity.legalAddress.region,
      postalCode: entity.legalAddress.postalCode,
      addressLines: entity.legalAddress.addressLines,
    },
    headquartersAddress: entity.headquartersAddress
      ? {
          country: entity.headquartersAddress.country || entity.legalAddress.country,
          city: entity.headquartersAddress.city,
          region: entity.headquartersAddress.region,
          postalCode: entity.headquartersAddress.postalCode,
          addressLines: entity.headquartersAddress.addressLines,
        }
      : undefined,
    registrationStatus: registration.status as GLEIFEntity['registrationStatus'],
    entityCategory: entity.category,
    legalForm: entity.legalForm?.other || entity.legalForm?.id,
    // Extended fields for ESA compliance
    registeredAs: entity.registeredAs,
    registeredAt: entity.registeredAt?.id || entity.registeredAt?.other,
    jurisdiction: entity.jurisdiction,
    entityStatus: entity.status as 'ACTIVE' | 'INACTIVE' | undefined,
    nextRenewalDate: registration.nextRenewalDate,
    entityCreationDate: entity.creationDate,
    legalFormCode: entity.legalForm?.id,
    corroborationLevel: registration.corroborationLevel,
    lastUpdateDate: registration.lastUpdateDate,
    initialRegistrationDate: registration.initialRegistrationDate,
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

// ============================================
// LEVEL 2 API - PARENT RELATIONSHIPS
// ============================================

/**
 * Get direct parent entity for an LEI
 * Uses GLEIF Level 2 data (direct-parent endpoint)
 *
 * @param lei - The child LEI to look up parent for
 * @returns Parent entity info or null if not found/reported
 */
export async function getDirectParent(lei: string): Promise<GLEIFParentEntity | null> {
  if (!lei || lei.length !== 20) {
    return null;
  }

  const normalizedLEI = lei.toUpperCase().trim();

  try {
    // GLEIF Level 2 API - direct parent relationship
    const response = await fetch(
      `${GLEIF_API_BASE}/lei-records/${normalizedLEI}/direct-parent`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
        },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No parent reported
      }
      throw new Error(`GLEIF parent API error: ${response.status}`);
    }

    const json: GLEIFRelationshipResponse = await response.json();

    if (!json.data || (Array.isArray(json.data) && json.data.length === 0)) {
      return null;
    }

    const record = Array.isArray(json.data) ? json.data[0] : json.data;
    const parentLEI = record.relationships?.['related-entity']?.data?.id;

    if (!parentLEI) {
      return null;
    }

    // Fetch parent entity details
    const parentEntity = await lookupLEI(parentLEI);
    if (!parentEntity) {
      return null;
    }

    return {
      lei: parentLEI,
      legalName: parentEntity.legalName,
      country: parentEntity.legalAddress.country,
      relationshipType: 'IS_DIRECTLY_CONSOLIDATED_BY',
    };
  } catch (error) {
    console.error('GLEIF direct parent lookup error:', error);
    return null;
  }
}

/**
 * Get ultimate parent entity for an LEI
 * Uses GLEIF Level 2 data (ultimate-parent endpoint)
 *
 * @param lei - The child LEI to look up ultimate parent for
 * @returns Ultimate parent entity info or null if not found/reported
 */
export async function getUltimateParent(lei: string): Promise<GLEIFParentEntity | null> {
  if (!lei || lei.length !== 20) {
    return null;
  }

  const normalizedLEI = lei.toUpperCase().trim();

  try {
    // GLEIF Level 2 API - ultimate parent relationship
    const response = await fetch(
      `${GLEIF_API_BASE}/lei-records/${normalizedLEI}/ultimate-parent`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
        },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No parent reported
      }
      throw new Error(`GLEIF ultimate parent API error: ${response.status}`);
    }

    const json: GLEIFRelationshipResponse = await response.json();

    if (!json.data || (Array.isArray(json.data) && json.data.length === 0)) {
      return null;
    }

    const record = Array.isArray(json.data) ? json.data[0] : json.data;
    const parentLEI = record.relationships?.['related-entity']?.data?.id;

    if (!parentLEI) {
      return null;
    }

    // Fetch parent entity details
    const parentEntity = await lookupLEI(parentLEI);
    if (!parentEntity) {
      return null;
    }

    return {
      lei: parentLEI,
      legalName: parentEntity.legalName,
      country: parentEntity.legalAddress.country,
      relationshipType: 'IS_ULTIMATELY_CONSOLIDATED_BY',
    };
  } catch (error) {
    console.error('GLEIF ultimate parent lookup error:', error);
    return null;
  }
}

/**
 * Enriched LEI lookup with all available data including parent relationships
 * This is the comprehensive lookup for ESA DORA compliance
 *
 * Fetches:
 * - Full entity data (Level 1)
 * - Direct parent (Level 2)
 * - Ultimate parent (Level 2)
 *
 * @param lei - The 20-character LEI to look up
 * @returns Fully enriched entity with parent data, or null if not found
 */
export async function lookupLEIEnriched(lei: string): Promise<GLEIFEnrichedEntity | null> {
  if (!lei || lei.length !== 20) {
    return null;
  }

  const normalizedLEI = lei.toUpperCase().trim();
  const cacheKey = `enriched:${normalizedLEI}`;

  // Check enriched cache
  const cached = enrichedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch main entity data
    const response = await fetch(`${GLEIF_API_BASE}/lei-records/${normalizedLEI}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.api+json',
      },
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

    // Map to enriched entity (all Level 1 fields)
    const enrichedEntity = mapGLEIFRecordFull(record);

    // Fetch parent relationships in parallel for efficiency
    const [directParent, ultimateParent] = await Promise.all([
      getDirectParent(normalizedLEI),
      getUltimateParent(normalizedLEI),
    ]);

    enrichedEntity.directParent = directParent;
    enrichedEntity.ultimateParent = ultimateParent;

    // Cache enriched result
    enrichedCache.set(cacheKey, { data: enrichedEntity, timestamp: Date.now() });

    return enrichedEntity;
  } catch (error) {
    console.error('GLEIF enriched lookup error:', error);
    return null;
  }
}

/**
 * Validate LEI and return enriched entity data
 * Enhanced version for ESA compliance with all available fields
 */
export async function validateLEIEnriched(lei: string): Promise<{
  valid: boolean;
  entity?: GLEIFEnrichedEntity;
  error?: string;
  warnings?: string[];
}> {
  if (!lei) {
    return { valid: false, error: 'LEI is required' };
  }

  const normalizedLEI = lei.toUpperCase().trim();

  if (!/^[A-Z0-9]{20}$/.test(normalizedLEI)) {
    return { valid: false, error: 'LEI must be exactly 20 alphanumeric characters' };
  }

  const entity = await lookupLEIEnriched(normalizedLEI);

  if (!entity) {
    return { valid: false, error: 'LEI not found in GLEIF database' };
  }

  const warnings: string[] = [];

  // Check registration status
  if (entity.registrationStatus !== 'ISSUED') {
    return {
      valid: false,
      entity,
      error: `LEI status is ${entity.registrationStatus}, not ISSUED`,
    };
  }

  // Check entity status
  if (entity.entityStatus === 'INACTIVE') {
    warnings.push('Entity is marked as INACTIVE in GLEIF');
  }

  // Check LEI renewal date
  if (entity.nextRenewalDate) {
    const renewalDate = new Date(entity.nextRenewalDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (renewalDate < new Date()) {
      warnings.push('LEI renewal date has passed - renewal may be required');
    } else if (renewalDate < thirtyDaysFromNow) {
      warnings.push(`LEI renewal due within 30 days (${entity.nextRenewalDate})`);
    }
  }

  // Check for missing parent data (required for ESA)
  if (!entity.ultimateParent && !entity.directParent) {
    warnings.push('No parent company information reported - may need manual entry for ESA B_05.01.0110');
  }

  return {
    valid: true,
    entity,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
