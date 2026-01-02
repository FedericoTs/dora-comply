'use client';

/**
 * Navigation Providers
 *
 * Client-side providers for navigation state management.
 * Used in the dashboard layout to enable breadcrumb context.
 */

import { Suspense, type ReactNode } from 'react';
import { BreadcrumbProvider } from '@/lib/navigation/breadcrumb-context';

interface NavigationProvidersProps {
  children: ReactNode;
}

export function NavigationProviders({ children }: NavigationProvidersProps) {
  return (
    <Suspense fallback={null}>
      <BreadcrumbProvider>
        {children}
      </BreadcrumbProvider>
    </Suspense>
  );
}
