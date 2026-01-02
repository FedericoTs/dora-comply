'use client';

/**
 * Breadcrumb Context Provider
 *
 * Manages navigation state across the application to enable:
 * - Context-aware "back" navigation
 * - Breadcrumb trail persistence
 * - URL-based context preservation
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

// Types for breadcrumb items
export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'default' | 'success' | 'warning' | 'error';
}

// Navigation context for "from" tracking
export interface NavigationContext {
  from?: 'vendor' | 'document' | 'dashboard' | 'roi' | 'incidents';
  vendorId?: string;
  vendorName?: string;
  documentId?: string;
  documentName?: string;
  tab?: string;
}

interface BreadcrumbContextValue {
  /** Build a URL with navigation context preserved */
  buildContextUrl: (basePath: string, additionalParams?: Record<string, string>) => string;
  /** Get navigation context from URL params */
  getNavigationContext: () => NavigationContext;
  /** Build "back" link based on context */
  getBackLink: () => { href: string; label: string };
  /** Generate breadcrumbs for current context */
  getBreadcrumbs: (currentPage: { label: string; href: string }) => BreadcrumbItem[];
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  const getNavigationContext = useCallback((): NavigationContext => {
    return {
      from: searchParams.get('from') as NavigationContext['from'] || undefined,
      vendorId: searchParams.get('vendorId') || undefined,
      vendorName: searchParams.get('vendorName') || undefined,
      documentId: searchParams.get('documentId') || undefined,
      documentName: searchParams.get('documentName') || undefined,
      tab: searchParams.get('tab') || undefined,
    };
  }, [searchParams]);

  const buildContextUrl = useCallback((basePath: string, additionalParams?: Record<string, string>): string => {
    const context = getNavigationContext();
    const params = new URLSearchParams();

    // Preserve existing context
    if (context.from) params.set('from', context.from);
    if (context.vendorId) params.set('vendorId', context.vendorId);
    if (context.vendorName) params.set('vendorName', context.vendorName);
    if (context.documentId) params.set('documentId', context.documentId);
    if (context.documentName) params.set('documentName', context.documentName);
    if (context.tab) params.set('tab', context.tab);

    // Add additional params
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        params.set(key, value);
      });
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }, [getNavigationContext]);

  const getBackLink = useCallback((): { href: string; label: string } => {
    const context = getNavigationContext();

    // Determine back destination based on context
    if (context.from === 'vendor' && context.vendorId) {
      const tab = context.tab || 'documents';
      return {
        href: `/vendors/${context.vendorId}?tab=${tab}`,
        label: context.vendorName ? `Back to ${context.vendorName}` : 'Back to Vendor',
      };
    }

    if (context.from === 'document' && context.documentId) {
      return {
        href: `/documents/${context.documentId}`,
        label: context.documentName ? `Back to ${context.documentName}` : 'Back to Document',
      };
    }

    if (context.from === 'roi') {
      return { href: '/roi', label: 'Back to Register' };
    }

    if (context.from === 'incidents') {
      return { href: '/incidents', label: 'Back to Incidents' };
    }

    // Default fallbacks based on current URL patterns
    return { href: '/dashboard', label: 'Back to Dashboard' };
  }, [getNavigationContext]);

  const getBreadcrumbs = useCallback((currentPage: { label: string; href: string }): BreadcrumbItem[] => {
    const context = getNavigationContext();
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' },
    ];

    // Build breadcrumb trail based on context
    if (context.from === 'vendor' && context.vendorId) {
      breadcrumbs.push({ label: 'Vendors', href: '/vendors' });
      breadcrumbs.push({
        label: context.vendorName || 'Vendor',
        href: `/vendors/${context.vendorId}`,
      });
    } else if (context.from === 'document') {
      breadcrumbs.push({ label: 'Documents', href: '/documents' });
    } else if (context.from === 'roi') {
      breadcrumbs.push({ label: 'Register of Information', href: '/roi' });
    } else if (context.from === 'incidents') {
      breadcrumbs.push({ label: 'Incidents', href: '/incidents' });
    }

    // Add document in chain if we have it and came from vendor
    if (context.documentId && context.from === 'vendor') {
      breadcrumbs.push({
        label: context.documentName || 'Document',
        href: buildContextUrl(`/documents/${context.documentId}`),
      });
    }

    // Add current page (non-clickable)
    breadcrumbs.push(currentPage);

    return breadcrumbs;
  }, [getNavigationContext, buildContextUrl]);

  const value = useMemo(() => ({
    buildContextUrl,
    getNavigationContext,
    getBackLink,
    getBreadcrumbs,
  }), [buildContextUrl, getNavigationContext, getBackLink, getBreadcrumbs]);

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}

/**
 * Helper to create context params when navigating to a page
 */
export function createNavigationParams(context: NavigationContext): string {
  const params = new URLSearchParams();

  if (context.from) params.set('from', context.from);
  if (context.vendorId) params.set('vendorId', context.vendorId);
  if (context.vendorName) params.set('vendorName', context.vendorName);
  if (context.documentId) params.set('documentId', context.documentId);
  if (context.documentName) params.set('documentName', context.documentName);
  if (context.tab) params.set('tab', context.tab);

  return params.toString();
}
