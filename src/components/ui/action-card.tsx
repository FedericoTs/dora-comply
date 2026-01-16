'use client';

import { X, ArrowRight, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ActionCardProps {
  /** Priority level determines color */
  priority: ActionPriority;
  /** Action title */
  title: string;
  /** Optional description */
  description?: string;
  /** Due date (ISO string or Date) */
  dueDate?: string | Date;
  /** Assignee name */
  assignee?: string;
  /** Primary action - either onClick handler or href link */
  primaryAction: { label: string; onClick: () => void } | { label: string; href: string };
  /** Optional secondary action */
  secondaryAction?: { label: string; onClick: () => void };
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Whether the action is completed */
  isCompleted?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * ActionCard - Priority-colored card for next actions with CTA buttons
 *
 * Usage:
 * ```tsx
 * <ActionCard
 *   priority="high"
 *   title="Upload SOC 2 Report"
 *   description="Required for DORA compliance"
 *   dueDate="2024-02-15"
 *   primaryAction={{ label: "Upload", href: "/documents/upload" }}
 *   onDismiss={() => handleDismiss(id)}
 * />
 * ```
 */
export function ActionCard({
  priority,
  title,
  description,
  dueDate,
  assignee,
  primaryAction,
  secondaryAction,
  onDismiss,
  isCompleted = false,
  size = 'md',
  className,
}: ActionCardProps) {
  // Priority styling
  const priorityConfig: Record<ActionPriority, {
    bg: string;
    border: string;
    indicator: string;
    icon: typeof AlertTriangle;
    iconColor: string;
    label: string;
  }> = {
    critical: {
      bg: 'bg-red-500/5 dark:bg-red-500/10',
      border: 'border-red-500/30',
      indicator: 'bg-red-500',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      label: 'Critical',
    },
    high: {
      bg: 'bg-orange-500/5 dark:bg-orange-500/10',
      border: 'border-orange-500/30',
      indicator: 'bg-orange-500',
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      border: 'border-amber-500/30',
      indicator: 'bg-amber-500',
      icon: Clock,
      iconColor: 'text-amber-500',
      label: 'Medium',
    },
    low: {
      bg: 'bg-blue-500/5 dark:bg-blue-500/10',
      border: 'border-blue-500/30',
      indicator: 'bg-blue-500',
      icon: Clock,
      iconColor: 'text-blue-500',
      label: 'Low',
    },
  };

  const config = priorityConfig[priority];
  const Icon = isCompleted ? CheckCircle2 : config.icon;

  // Format due date
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  // Check if overdue
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !isCompleted;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      gap: 'gap-2',
      titleSize: 'text-sm',
      descSize: 'text-xs',
      indicatorSize: 'w-1',
    },
    md: {
      padding: 'p-4',
      gap: 'gap-3',
      titleSize: 'text-base',
      descSize: 'text-sm',
      indicatorSize: 'w-1.5',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        'relative flex rounded-lg border',
        config.bg,
        config.border,
        isCompleted && 'opacity-60',
        className
      )}
    >
      {/* Priority indicator bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 rounded-l-lg',
          sizes.indicatorSize,
          config.indicator
        )}
      />

      {/* Content */}
      <div className={cn('flex-1 flex items-start', sizes.padding, sizes.gap, 'pl-4')}>
        {/* Icon */}
        <Icon
          className={cn(
            'h-5 w-5 mt-0.5 shrink-0',
            isCompleted ? 'text-emerald-500' : config.iconColor
          )}
        />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'font-medium leading-snug',
                sizes.titleSize,
                isCompleted && 'line-through'
              )}
            >
              {title}
            </h4>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 p-1 -m-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className={cn('text-muted-foreground mt-0.5', sizes.descSize)}>
              {description}
            </p>
          )}

          {/* Meta row: due date + assignee */}
          {(formattedDueDate || assignee) && (
            <div className={cn('flex items-center gap-3 mt-2', sizes.descSize)}>
              {formattedDueDate && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {isOverdue ? 'Overdue: ' : 'Due: '}
                  {formattedDueDate}
                </span>
              )}
              {assignee && (
                <span className="text-muted-foreground">
                  Assigned to: {assignee}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {!isCompleted && (
            <div className="flex items-center gap-2 mt-3">
              {'href' in primaryAction ? (
                <Button size="sm" asChild>
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}

              {secondaryAction && (
                <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ActionList - Container for multiple ActionCards
 */
export interface ActionListProps {
  /** List of actions */
  actions: Array<Omit<ActionCardProps, 'size'>>;
  /** Maximum items to show */
  maxItems?: number;
  /** Show "View All" link */
  viewAllHref?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Size variant for cards */
  cardSize?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

export function ActionList({
  actions,
  maxItems = 5,
  viewAllHref,
  emptyMessage = 'No pending actions',
  cardSize = 'md',
  className,
}: ActionListProps) {
  const visibleActions = actions.slice(0, maxItems);
  const hiddenCount = actions.length - maxItems;

  if (actions.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-muted-foreground', className)}>
        <CheckCircle2 className="h-5 w-5 mr-2" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {visibleActions.map((action, index) => (
        <ActionCard key={index} {...action} size={cardSize} />
      ))}

      {hiddenCount > 0 && viewAllHref && (
        <div className="pt-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href={viewAllHref}>
              View {hiddenCount} more action{hiddenCount > 1 ? 's' : ''}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
