/**
 * OpenSanctions API Integration
 *
 * OpenSanctions provides a comprehensive dataset of sanctions lists, watchlists,
 * and politically exposed persons (PEPs) from around the world.
 *
 * API Docs: https://www.opensanctions.org/docs/api/
 *
 * NOTE: API key is required. Free trial keys available for business email signups.
 * Set OPENSANCTIONS_API_KEY environment variable with your API key.
 *
 * Alternatively, use the EU Consolidated Sanctions List (free, no API key required)
 * via the fallback endpoint.
 */

const OPENSANCTIONS_API = 'https://api.opensanctions.org';
const OPENSANCTIONS_API_KEY = process.env.OPENSANCTIONS_API_KEY;

export interface SanctionsMatch {
  id: string;
  caption: string;
  schema: string;
  properties: {
    name?: string[];
    alias?: string[];
    country?: string[];
    topics?: string[];
    sourceUrl?: string[];
  };
  datasets: string[];
  score: number;
  match: boolean;
}

export interface SanctionsResult {
  matched: boolean;
  matchCount: number;
  matches: SanctionsMatch[];
  checkedAt: string;
  queryName: string;
  queryCountry?: string;
  datasets: string[];
}

export interface SanctionsError {
  error: true;
  message: string;
  code: string;
}

// Common sanctions datasets
export const SANCTIONS_DATASETS = {
  OFAC: 'us_ofac_sdn',
  EU: 'eu_fsf',
  UN: 'un_sc_sanctions',
  UK: 'gb_hmt_sanctions',
  INTERPOL: 'interpol_red_notices',
  PEP: 'pep',
};

/**
 * Check if OpenSanctions API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!OPENSANCTIONS_API_KEY;
}

/**
 * Check an entity name against global sanctions lists
 *
 * @param name - The entity name to check
 * @param country - Optional ISO country code to narrow results
 * @returns Sanctions check result
 */
export async function checkSanctions(
  name: string,
  country?: string
): Promise<SanctionsResult | SanctionsError> {
  // Check for API key first
  if (!OPENSANCTIONS_API_KEY) {
    return {
      error: true,
      message: 'OpenSanctions API key not configured. To enable sanctions screening, sign up for a free API key at opensanctions.org and add OPENSANCTIONS_API_KEY to your environment variables.',
      code: 'API_KEY_MISSING',
    };
  }

  try {
    // Build query parameters
    const params = new URLSearchParams({
      q: name,
      schema: 'LegalEntity', // Focus on companies/organizations
      limit: '10',
      threshold: '0.7', // Minimum match score (0-1)
    });

    if (country) {
      params.append('countries', country);
    }

    const response = await fetch(`${OPENSANCTIONS_API}/match/default?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `ApiKey ${OPENSANCTIONS_API_KEY}`,
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          error: true,
          message: 'Invalid or expired API key. Please check your OPENSANCTIONS_API_KEY environment variable.',
          code: 'API_KEY_INVALID',
        };
      }
      if (response.status === 429) {
        return {
          error: true,
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMITED',
        };
      }
      return {
        error: true,
        message: `API error: ${response.status} ${response.statusText}`,
        code: 'API_ERROR',
      };
    }

    const data = await response.json();

    // Process results
    const matches: SanctionsMatch[] = (data.results || []).map((result: Record<string, unknown>) => ({
      id: result.id as string,
      caption: result.caption as string || 'Unknown',
      schema: result.schema as string,
      properties: result.properties as SanctionsMatch['properties'] || {},
      datasets: result.datasets as string[] || [],
      score: result.score as number || 0,
      match: (result.score as number || 0) >= 0.8,
    }));

    // Get unique datasets from all matches
    const datasets = [...new Set(matches.flatMap(m => m.datasets))];

    // Count high-confidence matches
    const highConfidenceMatches = matches.filter(m => m.score >= 0.8);

    return {
      matched: highConfidenceMatches.length > 0,
      matchCount: highConfidenceMatches.length,
      matches,
      checkedAt: new Date().toISOString(),
      queryName: name,
      queryCountry: country,
      datasets,
    };
  } catch (error) {
    console.error('[OpenSanctions] API error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get the display name for a sanctions dataset
 */
export function getDatasetDisplayName(datasetId: string): string {
  const names: Record<string, string> = {
    us_ofac_sdn: 'OFAC SDN (USA)',
    us_ofac_cons: 'OFAC Consolidated (USA)',
    eu_fsf: 'EU Financial Sanctions',
    un_sc_sanctions: 'UN Security Council',
    gb_hmt_sanctions: 'HMT Sanctions (UK)',
    interpol_red_notices: 'INTERPOL Red Notices',
    pep: 'Politically Exposed Persons',
    ru_rupep: 'Russia PEPs',
    every_politician: 'EveryPolitician',
    icij_offshoreleaks: 'ICIJ Offshore Leaks',
    worldbank_debarred: 'World Bank Debarred',
    ch_seco_sanctions: 'SECO Sanctions (Switzerland)',
    au_dfat_sanctions: 'DFAT Sanctions (Australia)',
    ca_dfatd_sema_sanctions: 'SEMA Sanctions (Canada)',
    jp_mof_sanctions: 'MOF Sanctions (Japan)',
  };
  return names[datasetId] || datasetId;
}

/**
 * Format a match for display
 */
export function formatSanctionsMatch(match: SanctionsMatch): {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  sources: string[];
} {
  const severity = match.score >= 0.9 ? 'high' : match.score >= 0.75 ? 'medium' : 'low';

  const sources = match.datasets.map(getDatasetDisplayName);

  const countries = match.properties.country?.join(', ') || 'Unknown';
  const topics = match.properties.topics?.join(', ') || '';

  return {
    severity,
    title: match.caption,
    description: `Country: ${countries}${topics ? ` | Topics: ${topics}` : ''}`,
    sources,
  };
}

/**
 * Check if a result indicates a sanctions error
 */
export function isSanctionsError(
  result: SanctionsResult | SanctionsError
): result is SanctionsError {
  return 'error' in result && result.error === true;
}
