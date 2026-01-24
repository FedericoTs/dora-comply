/**
 * Finding Severity Badge Component
 *
 * Displays finding severity with appropriate styling and optional icon.
 */

import {
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FindingSeverity, FindingStatus } from '@/lib/testing/types';
import { getFindingSeverityLabel, getFindingStatusLabel } from '@/lib/testing/types';

interface FindingSeverityBadgeProps {
  severity: FindingSeverity;
  showIcon?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

const severityStyles: Record<FindingSeverity, string> = {
  critical: 'bg-error/10 text-error',
  high: 'bg-orange-500/10 text-orange-500',
  medium: 'bg-yellow-500/10 text-yellow-600',
  low: 'bg-blue-500/10 text-blue-600',
  informational: 'bg-muted text-muted-foreground',
};

const severityIcons: Record<FindingSeverity, typeof AlertTriangle | null> = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: AlertCircle,
  low: Info,
  informational: Info,
};

export function FindingSeverityBadge({
  severity,
  showIcon = false,
  size = 'default',
  className,
}: FindingSeverityBadgeProps) {
  const Icon = showIcon ? severityIcons[severity] : null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1',
        severityStyles[severity],
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
    >
      {Icon && <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />}
      {getFindingSeverityLabel(severity)}
    </Badge>
  );
}

interface FindingStatusBadgeProps {
  status: FindingStatus;
  size?: 'sm' | 'default';
  className?: string;
}

const statusStyles: Record<FindingStatus, string> = {
  open: 'bg-error/10 text-error',
  in_remediation: 'bg-yellow-500/10 text-yellow-600',
  remediated: 'bg-blue-500/10 text-blue-600',
  verified: 'bg-success/10 text-success',
  risk_accepted: 'bg-purple-500/10 text-purple-600',
  false_positive: 'bg-muted text-muted-foreground line-through',
  deferred: 'bg-muted text-muted-foreground',
};

export function FindingStatusBadge({ status, size = 'default', className }: FindingStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'capitalize',
        statusStyles[status],
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
    >
      {getFindingStatusLabel(status)}
    </Badge>
  );
}
