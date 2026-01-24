'use client';

/**
 * Test Card Component
 *
 * Reusable card for displaying resilience test summary.
 * Used in test lists, dashboards, and detail pages.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  FlaskConical,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Pause,
  Ban,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TestListItem, ResilienceTestWithRelations } from '@/lib/testing/types';
import {
  getTestTypeLabel,
  getTestTypeShortLabel,
  getTestStatusLabel,
  getTestStatusColor,
  getTestResultLabel,
  getTestResultColor,
} from '@/lib/testing/types';

type TestCardData = TestListItem | ResilienceTestWithRelations;

interface TestCardProps {
  test: TestCardData;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onStatusChange?: (testId: string, status: string) => Promise<void>;
  onDelete?: (testId: string) => Promise<void>;
}

export function TestCard({
  test,
  variant = 'default',
  showActions = false,
  onStatusChange,
  onDelete,
}: TestCardProps) {
  const router = useRouter();

  const isOverdue =
    'planned_end_date' in test &&
    test.planned_end_date &&
    isPast(new Date(test.planned_end_date)) &&
    !['completed', 'cancelled'].includes(test.status);

  const statusColor = getTestStatusColor(test.status);
  const resultColor = test.overall_result ? getTestResultColor(test.overall_result) : null;

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <Link
        href={`/testing/tests/${test.id}`}
        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            test.status === 'completed' ? 'bg-success/10' : 'bg-muted'
          )}>
            <FlaskConical className={cn(
              'h-4 w-4',
              test.status === 'completed' ? 'text-success' : 'text-muted-foreground'
            )} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{test.name}</p>
            <p className="text-xs text-muted-foreground">
              {test.test_ref} · {getTestTypeShortLabel(test.test_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {test.critical_findings_count > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              {test.critical_findings_count}
            </Badge>
          )}
          {test.overall_result && (
            <Badge
              variant={resultColor === 'success' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                resultColor === 'success' && 'bg-success hover:bg-success/80',
                resultColor === 'warning' && 'bg-yellow-500/10 text-yellow-600',
                resultColor === 'destructive' && 'bg-error/10 text-error'
              )}
            >
              {getTestResultLabel(test.overall_result)}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={cn(
              'text-xs capitalize',
              statusColor === 'success' && 'bg-success/10 text-success',
              statusColor === 'warning' && 'bg-yellow-500/10 text-yellow-600',
              statusColor === 'info' && 'bg-blue-500/10 text-blue-600',
              statusColor === 'destructive' && 'bg-error/10 text-error'
            )}
          >
            {getTestStatusLabel(test.status)}
          </Badge>
        </div>
      </Link>
    );
  }

  // Default full card variant
  return (
    <Card className={cn(isOverdue && 'border-error/50')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              test.status === 'completed' ? 'bg-success/10' : 'bg-muted'
            )}>
              <FlaskConical className={cn(
                'h-5 w-5',
                test.status === 'completed' ? 'text-success' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs capitalize',
                    statusColor === 'success' && 'bg-success/10 text-success',
                    statusColor === 'warning' && 'bg-yellow-500/10 text-yellow-600',
                    statusColor === 'info' && 'bg-blue-500/10 text-blue-600',
                    statusColor === 'destructive' && 'bg-error/10 text-error'
                  )}
                >
                  {getTestStatusLabel(test.status)}
                </Badge>
                {test.overall_result && (
                  <Badge
                    variant={resultColor === 'success' ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      resultColor === 'success' && 'bg-success hover:bg-success/80',
                      resultColor === 'warning' && 'bg-yellow-500/10 text-yellow-600',
                      resultColor === 'destructive' && 'bg-error/10 text-error'
                    )}
                  >
                    {getTestResultLabel(test.overall_result)}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
              <Link href={`/testing/tests/${test.id}`} className="hover:underline">
                <h3 className="font-semibold">{test.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {test.test_ref} · {getTestTypeLabel(test.test_type)}
              </p>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/testing/tests/${test.id}`}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/testing/tests/${test.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Test
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {test.status === 'planned' && onStatusChange && (
                  <DropdownMenuItem onClick={() => onStatusChange(test.id, 'scheduled')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                )}
                {test.status === 'scheduled' && onStatusChange && (
                  <DropdownMenuItem onClick={() => onStatusChange(test.id, 'in_progress')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Test
                  </DropdownMenuItem>
                )}
                {test.status === 'in_progress' && onStatusChange && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange(test.id, 'on_hold')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Put On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(test.id, 'completed')}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete
                    </DropdownMenuItem>
                  </>
                )}
                {test.status === 'on_hold' && onStatusChange && (
                  <DropdownMenuItem onClick={() => onStatusChange(test.id, 'in_progress')}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                {!['completed', 'cancelled'].includes(test.status) && onStatusChange && (
                  <DropdownMenuItem onClick={() => onStatusChange(test.id, 'cancelled')}>
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-error focus:text-error"
                      onClick={() => onDelete(test.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">{test.findings_count}</span>
              {test.critical_findings_count > 0 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {test.critical_findings_count} critical
                </Badge>
              )}
            </div>
          </div>

          {test.planned_start_date && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Planned Start</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {format(new Date(test.planned_start_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {test.actual_end_date && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="font-medium">
                  {format(new Date(test.actual_end_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {'programme_name' in test && test.programme_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Programme</p>
              <span className="font-medium">{test.programme_name}</span>
            </div>
          )}

          {'vendor_name' in test && test.vendor_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vendor</p>
              <span className="font-medium">{test.vendor_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
