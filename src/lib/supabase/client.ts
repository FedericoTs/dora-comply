import { createBrowserClient } from '@supabase/ssr';
import { type DataRegion, getRegionConfig, DEFAULT_REGION } from './config';

const clients: Partial<Record<DataRegion, ReturnType<typeof createBrowserClient>>> = {};

export function createClient(region: DataRegion = DEFAULT_REGION) {
  if (clients[region]) {
    return clients[region]!;
  }

  const config = getRegionConfig(region);

  if (!config) {
    throw new Error(
      `Supabase is not configured for region "${region}". ` +
      `Please set NEXT_PUBLIC_SUPABASE_URL_${region.toUpperCase()} and ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY_${region.toUpperCase()} environment variables.`
    );
  }

  const client = createBrowserClient(config.url, config.anonKey);

  clients[region] = client;

  return client;
}

export function getClientForRegion(region: DataRegion) {
  return createClient(region);
}
