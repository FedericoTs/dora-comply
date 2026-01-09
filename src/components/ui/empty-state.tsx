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
  FileText,
  Search,
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
  className,
  children,
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  const Icon = icon || defaultIcons[variant];

  const ActionButton = ({ actionProps, isPrimary }: { actionProps: EmptyStateAction; isPrimary: boolean }) => {
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
  };

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
        {action && <ActionButton actionProps={action} isPrimary />}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className={cn('p-4 rounded-full mb-4', styles.iconBg)}>
        <Icon className={cn('h-8 w-8', styles.iconColor)} />
      </div>
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
      icon={Search}
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
      icon={FileText}
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
      icon={CheckCircle2}
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
