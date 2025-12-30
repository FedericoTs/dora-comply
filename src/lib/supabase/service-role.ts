/**
 * Service Role Supabase Client
 *
 * This client uses the service role key which bypasses RLS.
 * ONLY use this for server-side operations that need elevated privileges,
 * such as storage operations where RLS policies cannot be easily configured.
 *
 * IMPORTANT: Never expose this client to client-side code!
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { type DataRegion, getRegionConfig, DEFAULT_REGION, REGION_CONFIGS } from './config';

/**
 * Creates a Supabase client with service role privileges.
 * This client bypasses RLS and should only be used server-side.
 */
export function createServiceRoleClient(region: DataRegion = DEFAULT_REGION) {
  const config = getRegionConfig(region);

  if (!config) {
    throw new Error(
      `Supabase is not configured for region "${region}". ` +
      `Please set the required environment variables.`
    );
  }

  const serviceRoleKey = REGION_CONFIGS[region].serviceRoleKey;

  if (!serviceRoleKey) {
    // Fall back to anon key if service role key is not available
    // This will still work but be subject to RLS policies
    console.warn(
      `Service role key not configured for region "${region}". ` +
      `Falling back to anon key. Storage operations may fail if RLS policies are not set.`
    );
    return createSupabaseClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createSupabaseClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
