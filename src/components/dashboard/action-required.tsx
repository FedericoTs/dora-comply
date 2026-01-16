'use client';

import Link from 'next/link';
import {
  AlertCircle,
  Clock,
  FileText,
  Building2,
  Shield,
  FlaskConical,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionType = 'overdue' | 'pending' | 'expiring' | 'due_soon';
export type ActionIcon = 'alert' | 'clock' | 'document' | 'vendor' | 'compliance' | 'testing';

export interface ActionItem {
  id: string;
  priority: ActionPriority;
  type: ActionType;
  icon: ActionIcon;
  title: string;
  subtitle: string;
  href: string;
  dueDate?: Date;
  count?: number;
}

interface ActionRequiredProps {
  items: ActionItem[];
  maxItems?: number;
  className?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const PRIORITY_CONFIG: Record<ActionPriority, { color: string; bg: string; dot: string }> = {
  critical: {
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
    dot: 'bg-red-500',
  },
  high: {
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    dot: 'bg-orange-500',
  },
  medium: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
    dot: 'bg-amber-500',
  },
  low: {
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    dot: 'bg-blue-500',
  },
};

const ICON_MAP: Record<ActionIcon, LucideIcon> = {
  alert: AlertCircle,
  clock: Clock,
  document: FileText,
  vendor: Building2,
  compliance: Shield,
  testing: FlaskConical,
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDueDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  if (days <= 7) {
    return `Due in ${days}d`;
  }
  if (days <= 30) {
    const weeks = Math.ceil(days / 7);
    return `Due in ${weeks}w`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Components
// ============================================================================

function ActionItemRow({ item }: { item: ActionItem }) {
  const config = PRIORITY_CONFIG[item.priority];
  const Icon = ICON_MAP[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg transition-colors',
        config.bg
      )}
    >
      {/* Priority indicator */}
      <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />

      {/* Icon */}
      <div className={cn('p-1.5 rounded-md bg-background/80', config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium text-sm truncate', config.color)}>
            {item.count && item.count > 1 ? `${item.count} ` : ''}
            {item.title}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
      </div>

      {/* Due date */}
      {item.dueDate && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDueDate(item.dueDate)}
        </span>
      )}

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ActionRequired({
  items,
  maxItems = 5,
  className,
}: ActionRequiredProps) {
  // Sort by priority (critical first)
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder: ActionPriority[] = ['critical', 'high', 'medium', 'low'];
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  const displayedItems = sortedItems.slice(0, maxItems);
  const hasMore = sortedItems.length > maxItems;

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mb-3">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-medium text-emerald-700 dark:text-emerald-300">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No urgent actions needed right now
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-primary" />
            Action Required
            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {items.length}
            </span>
          </CardTitle>
          {hasMore && (
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/actions">View all</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedItems.map((item) => (
          <ActionItemRow key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Example Data Generator (for development/demo)
// ============================================================================

export function generateSampleActions(): ActionItem[] {
  return [
    {
      id: '1',
      priority: 'critical',
      type: 'overdue',
      icon: 'document',
      title: 'Overdue incident reports',
      subtitle: 'ICT-2024-003, ICT-2024-004 past 72h deadline',
      href: '/incidents?filter=overdue',
      count: 2,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: '2',
      priority: 'high',
      type: 'pending',
      icon: 'vendor',
      title: 'Vendors need SOC2',
      subtitle: 'Stripe, Twilio, SendGrid missing certification',
      href: '/vendors?filter=missing-soc2',
      count: 3,
    },
    {
      id: '3',
      priority: 'medium',
      type: 'expiring',
      icon: 'document',
      title: 'Contracts expiring',
      subtitle: 'AWS, Azure, GCP contracts expire within 90 days',
      href: '/vendors?filter=expiring-contracts',
      count: 5,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      id: '4',
      priority: 'low',
      type: 'due_soon',
      icon: 'testing',
      title: 'TLPT due soon',
      subtitle: 'Next threat-led penetration test due Q2 2026',
      href: '/testing/tlpt',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  ];
}
