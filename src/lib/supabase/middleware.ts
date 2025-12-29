import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { type DataRegion, getRegionConfig, DEFAULT_REGION, isValidRegion } from './config';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Get region from cookie or use default
  const regionCookie = request.cookies.get('data_region')?.value;
  const region: DataRegion = regionCookie && isValidRegion(regionCookie)
    ? regionCookie
    : DEFAULT_REGION;

  const config = getRegionConfig(region);

  // If Supabase isn't configured, skip auth (dev mode)
  if (!config) {
    return supabaseResponse;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  await supabase.auth.getUser();

  return supabaseResponse;
}
