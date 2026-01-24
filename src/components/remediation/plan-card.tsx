'use client';

/**
 * Plan Card Component
 *
 * Displays a remediation plan in card format with progress and status.
 */

import Link from 'next/link';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import {
  Calendar,
  User,
  Building2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { RemediationPlanWithRelations } from '@/lib/remediation/types';
import { PLAN_STATUS_INFO, PRIORITY_INFO, SOURCE_TYPE_INFO } from '@/lib/remediation/types';

interface PlanCardProps {
  plan: RemediationPlanWithRelations;
  compact?: boolean;
}

export function PlanCard({ plan, compact = false }: PlanCardProps) {
  const statusInfo = PLAN_STATUS_INFO[plan.status];
  const priorityInfo = PRIORITY_INFO[plan.priority];
  const sourceInfo = SOURCE_TYPE_INFO[plan.source_type];

  const isOverdue =
    plan.target_date &&
    isPast(new Date(plan.target_date)) &&
    !['completed', 'cancelled'].includes(plan.status);

  if (compact) {
    return (
      <Link href={`/remediation/${plan.id}`}>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-base truncate">{plan.title}</CardTitle>
                <CardDescription className="text-xs">{plan.plan_ref}</CardDescription>
              </div>
              <Badge className={cn('shrink-0', priorityInfo.color)}>
                {priorityInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {isOverdue && (
                <span className="text-error text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {plan.completed_actions}/{plan.total_actions} actions
                </span>
                <span>{plan.progress_percentage}%</span>
              </div>
              <Progress value={plan.progress_percentage} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/remediation/${plan.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {plan.plan_ref}
                    </span>
                    <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
                      {statusInfo.label}
                    </Badge>
                    {plan.framework && (
                      <Badge variant="secondary" className="text-xs uppercase">
                        {plan.framework}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium leading-tight">{plan.title}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
                <Badge className={cn('shrink-0', priorityInfo.color)}>
                  {priorityInfo.label}
                </Badge>
              </div>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {plan.vendor && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {plan.vendor.name}
                  </span>
                )}
                {plan.owner && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {plan.owner.full_name}
                  </span>
                )}
                {plan.target_date && (
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      isOverdue && 'text-error'
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(plan.target_date), 'MMM d, yyyy')}
                    {isOverdue && (
                      <AlertTriangle className="h-3.5 w-3.5 ml-0.5" />
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatDistanceToNow(new Date(plan.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {plan.completed_actions} of {plan.total_actions} actions completed
                    </span>
                    <span className="font-medium">{plan.progress_percentage}%</span>
                  </div>
                  <Progress value={plan.progress_percentage} className="h-2" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
