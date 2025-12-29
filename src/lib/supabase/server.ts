import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type DataRegion, getRegionConfig, DEFAULT_REGION } from './config';

export async function createClient(region: DataRegion = DEFAULT_REGION) {
  const cookieStore = await cookies();
  const config = getRegionConfig(region);

  if (!config) {
    throw new Error(
      `Supabase is not configured for region "${region}". ` +
      `Please set NEXT_PUBLIC_SUPABASE_URL_${region.toUpperCase()} and ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY_${region.toUpperCase()} environment variables.`
    );
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export async function getServerClientForRegion(region: DataRegion) {
  return createClient(region);
}
