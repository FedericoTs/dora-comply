'use client';

/**
 * Page Breadcrumb Component
 *
 * Renders breadcrumb navigation with context-aware back links.
 * Automatically builds breadcrumb trail based on URL context params.
 */

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageBreadcrumbProps {
  /** Custom breadcrumb segments (overrides auto-detection) */
  segments?: BreadcrumbSegment[];
  /** Current page name */
  currentPage: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back link (overrides context-based back) */
  backHref?: string;
  /** Custom back label */
  backLabel?: string;
  /** Maximum visible segments before collapsing */
  maxVisible?: number;
  /** Additional CSS classes */
  className?: string;
}

export function PageBreadcrumb({
  segments: customSegments,
  currentPage,
  showBack = true,
  backHref,
  backLabel,
  maxVisible = 4,
  className,
}: PageBreadcrumbProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get navigation context from URL params
  const from = searchParams.get('from');
  const vendorId = searchParams.get('vendorId');
  const vendorName = searchParams.get('vendorName');
  const documentId = searchParams.get('documentId');
  const documentName = searchParams.get('documentName');
  const tab = searchParams.get('tab');

  // Build context-aware breadcrumb segments if not provided
  const segments: BreadcrumbSegment[] = customSegments || buildSegments();

  function buildSegments(): BreadcrumbSegment[] {
    const items: BreadcrumbSegment[] = [];

    // Always start with Dashboard
    items.push({ label: 'Dashboard', href: '/dashboard', icon: Home });

    // Build based on navigation context
    if (from === 'vendor' && vendorId) {
      items.push({ label: 'Vendors', href: '/vendors' });
      const vendorHref = tab ? `/vendors/${vendorId}?tab=${tab}` : `/vendors/${vendorId}`;
      items.push({ label: vendorName || 'Vendor', href: vendorHref });

      // If we also have document context, add it
      if (documentId) {
        const docParams = new URLSearchParams();
        docParams.set('from', 'vendor');
        docParams.set('vendorId', vendorId);
        if (vendorName) docParams.set('vendorName', vendorName);
        items.push({
          label: documentName || 'Document',
          href: `/documents/${documentId}?${docParams.toString()}`,
        });
      }
    } else if (from === 'document' && documentId) {
      items.push({ label: 'Documents', href: '/documents' });
      items.push({
        label: documentName || 'Document',
        href: `/documents/${documentId}`,
      });
    } else if (from === 'roi') {
      items.push({ label: 'Register of Information', href: '/roi' });
    } else if (from === 'incidents') {
      items.push({ label: 'Incidents', href: '/incidents' });
    } else {
      // Auto-detect from pathname
      const pathParts = pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'vendors') {
        items.push({ label: 'Vendors', href: '/vendors' });
      } else if (pathParts[0] === 'documents') {
        items.push({ label: 'Documents', href: '/documents' });
      } else if (pathParts[0] === 'roi') {
        items.push({ label: 'Register of Information', href: '/roi' });
      } else if (pathParts[0] === 'incidents') {
        items.push({ label: 'Incidents', href: '/incidents' });
      }
    }

    return items;
  }

  // Determine back link
  function getBackLink(): { href: string; label: string } {
    if (backHref) {
      return { href: backHref, label: backLabel || 'Back' };
    }

    if (from === 'vendor' && vendorId) {
      const href = tab ? `/vendors/${vendorId}?tab=${tab}` : `/vendors/${vendorId}`;
      return { href, label: vendorName ? `Back to ${vendorName}` : 'Back to Vendor' };
    }

    if (from === 'document' && documentId) {
      return {
        href: `/documents/${documentId}`,
        label: documentName ? `Back to ${documentName}` : 'Back to Document',
      };
    }

    if (from === 'roi') {
      return { href: '/roi', label: 'Back to Register' };
    }

    if (from === 'incidents') {
      return { href: '/incidents', label: 'Back to Incidents' };
    }

    // Use second-to-last segment as back target
    if (segments.length >= 2) {
      const backSegment = segments[segments.length - 1];
      if (backSegment.href) {
        return { href: backSegment.href, label: `Back to ${backSegment.label}` };
      }
    }

    return { href: '/dashboard', label: 'Back to Dashboard' };
  }

  const back = getBackLink();

  // Collapse segments if too many
  const shouldCollapse = segments.length > maxVisible;
  const visibleSegments = shouldCollapse
    ? [segments[0], ...segments.slice(-2)]
    : segments;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {showBack && (
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={back.href}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{back.label}</span>
          </Link>
        </Button>
      )}

      <Breadcrumb>
        <BreadcrumbList>
          {visibleSegments.map((segment, index) => {
            const isFirst = index === 0;
            const Icon = segment.icon;

            return (
              <BreadcrumbItem key={segment.href || segment.label}>
                {!isFirst && <BreadcrumbSeparator />}

                {/* Show ellipsis after first item if collapsed */}
                {shouldCollapse && index === 1 && (
                  <>
                    <BreadcrumbEllipsis className="h-4 w-4" />
                    <BreadcrumbSeparator />
                  </>
                )}

                {segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href} className="flex items-center gap-1.5">
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {segment.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            );
          })}

          {/* Current page */}
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

/**
 * Minimal breadcrumb for simple pages
 */
export function SimpleBreadcrumb({
  parent,
  parentHref,
  current,
  showBack = true,
}: {
  parent: string;
  parentHref: string;
  current: string;
  showBack?: boolean;
}) {
  return (
    <PageBreadcrumb
      segments={[
        { label: 'Dashboard', href: '/dashboard', icon: Home },
        { label: parent, href: parentHref },
      ]}
      currentPage={current}
      showBack={showBack}
      backHref={parentHref}
      backLabel={`Back to ${parent}`}
    />
  );
}
