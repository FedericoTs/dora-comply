/**
 * Test Status Badge Component
 *
 * Displays test status with appropriate styling.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TestStatus, TestResult } from '@/lib/testing/types';
import { getTestStatusLabel, getTestResultLabel } from '@/lib/testing/types';

interface TestStatusBadgeProps {
  status: TestStatus;
  size?: 'sm' | 'default';
  className?: string;
}

const statusStyles: Record<TestStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-yellow-500/10 text-yellow-600',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-muted text-muted-foreground',
  on_hold: 'bg-orange-500/10 text-orange-500',
  remediation_required: 'bg-error/10 text-error',
};

export function TestStatusBadge({ status, size = 'default', className }: TestStatusBadgeProps) {
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
      {getTestStatusLabel(status)}
    </Badge>
  );
}

interface TestResultBadgeProps {
  result: TestResult;
  size?: 'sm' | 'default';
  className?: string;
}

const resultStyles: Record<TestResult, string> = {
  pass: 'bg-success hover:bg-success/80 text-white',
  pass_with_findings: 'bg-yellow-500/10 text-yellow-600',
  fail: 'bg-error/10 text-error',
  inconclusive: 'bg-muted text-muted-foreground',
};

export function TestResultBadge({ result, size = 'default', className }: TestResultBadgeProps) {
  return (
    <Badge
      variant={result === 'pass' ? 'default' : 'secondary'}
      className={cn(
        resultStyles[result],
        size === 'sm' && 'text-xs px-1.5 py-0',
        className
      )}
    >
      {getTestResultLabel(result)}
    </Badge>
  );
}
