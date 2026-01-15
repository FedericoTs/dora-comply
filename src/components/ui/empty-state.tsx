/**
 * Unified EmptyState Component
 *
 * A flexible empty state component that provides consistent
 * empty/zero-data UI across the application.
 *
 * Supports:
 * - Multiple variants (default, success, warning, info)
 * - Icons
 * - Custom titles and descriptions
 * - Primary and secondary CTAs
 * - Compact mode for inline use
 */

import * as React from 'react';
import Link from 'next/link';
import {
  Inbox,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type EmptyStateVariant = 'default' | 'success' | 'warning' | 'info';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export type EmptyStateIllustration = 'search' | 'documents' | 'vendors' | 'security' | 'success' | 'chart' | 'none';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Variant for styling */
  variant?: EmptyStateVariant;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Compact mode for inline/smaller areas */
  compact?: boolean;
  /** Show decorative illustration */
  illustration?: EmptyStateIllustration;
  /** Additional className */
  className?: string;
  /** Children for custom content */
  children?: React.ReactNode;
}

// ============================================================================
// Helpers
// ============================================================================

const variantStyles: Record<EmptyStateVariant, {
  iconBg: string;
  iconColor: string;
  titleColor: string;
}> = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    titleColor: 'text-foreground',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    titleColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    titleColor: 'text-warning',
  },
  info: {
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    titleColor: 'text-info',
  },
};

const defaultIcons: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

// Action button component - extracted to avoid creating during render
interface ActionButtonProps {
  actionProps: EmptyStateAction;
  isPrimary: boolean;
  compact?: boolean;
}

function ActionButton({ actionProps, isPrimary, compact }: ActionButtonProps) {
  const buttonContent = (
    <Button
      variant={actionProps.variant || (isPrimary ? 'default' : 'outline')}
      size={compact ? 'sm' : 'default'}
      onClick={actionProps.onClick}
    >
      {actionProps.label}
    </Button>
  );

  if (actionProps.href) {
    return <Link href={actionProps.href}>{buttonContent}</Link>;
  }

  return buttonContent;
}

// ============================================================================
// Illustrations - Lightweight SVG decorations
// ============================================================================

function Illustration({ type }: { type: EmptyStateIllustration }) {
  const baseClasses = "w-48 h-32 mx-auto mb-6";

  switch (type) {
    case 'search':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <circle cx="80" cy="50" r="35" className="fill-muted stroke-border" strokeWidth="2" />
          <line x1="105" y1="75" x2="140" y2="110" className="stroke-muted-foreground" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="50" r="20" className="fill-background" />
          <path d="M70 50 L75 55 L90 40" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="150" cy="25" r="8" className="fill-primary/20" />
          <circle cx="170" cy="45" r="5" className="fill-primary/10" />
        </svg>
      );
    case 'documents':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <rect x="50" y="10" width="60" height="80" rx="4" className="fill-muted stroke-border" strokeWidth="2" />
          <rect x="70" y="30" width="60" height="80" rx="4" className="fill-background stroke-border" strokeWidth="2" />
          <line x1="82" y1="50" x2="118" y2="50" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
          <line x1="82" y1="62" x2="110" y2="62" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
          <line x1="82" y1="74" x2="115" y2="74" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
          <circle cx="155" cy="85" r="18" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <path d="M150 85 L153 88 L162 79" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 'vendors':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <rect x="30" y="40" width="50" height="60" rx="4" className="fill-muted stroke-border" strokeWidth="2" />
          <rect x="35" y="50" width="40" height="20" rx="2" className="fill-background" />
          <rect x="75" y="20" width="50" height="80" rx="4" className="fill-background stroke-border" strokeWidth="2" />
          <rect x="80" y="30" width="40" height="20" rx="2" className="fill-primary/10" />
          <rect x="120" y="40" width="50" height="60" rx="4" className="fill-muted stroke-border" strokeWidth="2" />
          <rect x="125" y="50" width="40" height="20" rx="2" className="fill-background" />
          <line x1="55" y1="35" x2="100" y2="15" className="stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="145" y1="35" x2="100" y2="15" className="stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      );
    case 'security':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <path d="M100 10 L150 30 L150 70 Q150 100 100 115 Q50 100 50 70 L50 30 Z" className="fill-primary/10 stroke-primary" strokeWidth="2" />
          <path d="M85 60 L95 70 L115 50" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="165" cy="25" r="10" className="fill-success/20" />
          <circle cx="35" cy="80" r="8" className="fill-muted" />
        </svg>
      );
    case 'success':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <circle cx="100" cy="60" r="40" className="fill-success/10 stroke-success" strokeWidth="2" />
          <path d="M80 60 L95 75 L125 45" className="stroke-success" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="45" cy="30" r="8" className="fill-success/20" />
          <circle cx="160" cy="85" r="12" className="fill-success/10" />
          <circle cx="155" cy="25" r="5" className="fill-success/30" />
        </svg>
      );
    case 'chart':
      return (
        <svg className={baseClasses} viewBox="0 0 200 120" fill="none">
          <rect x="30" y="70" width="25" height="40" rx="2" className="fill-muted" />
          <rect x="65" y="50" width="25" height="60" rx="2" className="fill-primary/30" />
          <rect x="100" y="30" width="25" height="80" rx="2" className="fill-primary/50" />
          <rect x="135" y="45" width="25" height="65" rx="2" className="fill-primary" />
          <line x1="25" y1="110" x2="175" y2="110" className="stroke-border" strokeWidth="2" />
          <path d="M30 65 Q65 40 100 25 T170 20" className="stroke-success" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================================
// Component
// ============================================================================

export function EmptyState({
  icon,
  title,
  description,
  variant = 'default',
  action,
  secondaryAction,
  compact = false,
  illustration,
  className,
  children,
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  const Icon = icon || defaultIcons[variant];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 py-6 px-4', className)}>
        <div className={cn('p-2 rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', styles.titleColor)}>{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && <ActionButton actionProps={action} isPrimary compact />}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {illustration && illustration !== 'none' && (
        <Illustration type={illustration} />
      )}
      {(!illustration || illustration === 'none') && (
        <div className={cn('p-4 rounded-full mb-4', styles.iconBg)}>
          <Icon className={cn('h-8 w-8', styles.iconColor)} />
        </div>
      )}
      <h3 className={cn('text-lg font-medium mb-1', styles.titleColor)}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {children}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-4">
          {action && <ActionButton actionProps={action} isPrimary />}
          {secondaryAction && <ActionButton actionProps={secondaryAction} isPrimary={false} />}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Preset Empty States
// ============================================================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

/** No results from search */
export function SearchEmptyState({
  searchQuery,
  onClear,
  className,
}: {
  searchQuery?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={
        searchQuery
          ? `No matches for "${searchQuery}". Try adjusting your search terms.`
          : 'Try adjusting your search terms.'
      }
      action={onClear ? { label: 'Clear Search', onClick: onClear, variant: 'outline' } : undefined}
      className={className}
    />
  );
}

/** No results from filters */
export function FilterEmptyState({
  onClear,
  className,
}: {
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Filter}
      title="No matching items"
      description="Try adjusting your filters to see more results."
      action={onClear ? { label: 'Clear Filters', onClick: onClear, variant: 'outline' } : undefined}
      className={className}
    />
  );
}

/** No documents */
export function NoDocumentsState({
  onUpload,
  className,
}: PresetEmptyStateProps & { onUpload?: () => void }) {
  return (
    <EmptyState
      illustration="documents"
      title="No documents yet"
      description="Upload your first compliance document to get started."
      action={onUpload ? { label: 'Upload Document', onClick: onUpload } : undefined}
      className={className}
    />
  );
}

/** Positive finding - no issues */
export function NoIssuesState({
  title = 'No issues found',
  description = 'All checks passed successfully.',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyState
      illustration="success"
      variant="success"
      title={title}
      description={description}
      className={className}
    />
  );
}

/** Generic no data state */
export function NoDataState({
  title = 'No data available',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      className={className}
    />
  );
}
