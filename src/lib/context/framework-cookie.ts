/**
 * Framework Cookie Helper
 *
 * Server-side utility to read the active framework from cookies.
 * This allows Server Components to know the user's selected framework
 * for initial data fetching.
 */

import { cookies } from 'next/headers';
import type { FrameworkCode } from '@/lib/licensing/types';

export const FRAMEWORK_COOKIE_NAME = 'active-framework';
const VALID_FRAMEWORKS: FrameworkCode[] = ['nis2', 'dora', 'gdpr', 'iso27001'];

/**
 * Get the active framework from cookies (server-side)
 * Returns the framework code or null if not set/invalid
 */
export async function getActiveFrameworkFromCookie(): Promise<FrameworkCode | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(FRAMEWORK_COOKIE_NAME)?.value;

  if (value && VALID_FRAMEWORKS.includes(value as FrameworkCode)) {
    return value as FrameworkCode;
  }

  return null;
}

/**
 * Set the active framework cookie (for use in Server Actions or Route Handlers)
 */
export async function setActiveFrameworkCookie(framework: FrameworkCode): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(FRAMEWORK_COOKIE_NAME, framework, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
