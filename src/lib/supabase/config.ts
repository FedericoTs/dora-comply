export type DataRegion = 'us' | 'eu';

export interface RegionConfig {
  url: string;
  anonKey: string;
}

export const REGION_CONFIGS: Record<DataRegion, RegionConfig> = {
  us: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_US || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_US || '',
  },
  eu: {
    // Support both region-specific and default env vars
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_EU || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_EU || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export const DEFAULT_REGION: DataRegion =
  (process.env.NEXT_PUBLIC_DEFAULT_REGION as DataRegion) || 'eu';

// Check if Supabase is configured (for dev mode without credentials)
export function isSupabaseConfigured(region: DataRegion = DEFAULT_REGION): boolean {
  const config = REGION_CONFIGS[region];
  return !!(config.url && config.anonKey);
}

export function getRegionConfig(region: DataRegion = DEFAULT_REGION): RegionConfig | null {
  const config = REGION_CONFIGS[region];

  if (!config.url || !config.anonKey) {
    // Return null instead of throwing - allows dev mode without Supabase
    return null;
  }

  return config;
}

export function isValidRegion(region: string): region is DataRegion {
  return region === 'us' || region === 'eu';
}
