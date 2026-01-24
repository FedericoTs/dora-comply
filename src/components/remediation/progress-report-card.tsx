'use client';

/**
 * Progress Report Card Component
 *
 * Displays detailed progress metrics for a remediation plan.
 */

import { useMemo } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  Users,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  RemediationPlanWithRelations,
  RemediationActionWithRelations,
  ActionStatus,
} from '@/lib/remediation/types';

interface ProgressReportCardProps {
  plan: RemediationPlanWithRelations;
  actions: RemediationActionWithRelations[];
}

export function ProgressReportCard({ plan, actions }: ProgressReportCardProps) {
  const metrics = useMemo(() => {
    const total = actions.length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const blocked = actions.filter(a => a.status === 'blocked').length;
    const inProgress = actions.filter(a => ['in_progress', 'in_review'].includes(a.status)).length;
    const overdue = actions.filter(a =>
      a.due_date &&
      isPast(new Date(a.due_date)) &&
      !['completed', 'cancelled'].includes(a.status)
    ).length;

    // Evidence metrics
    const actionsRequiringEvidence = actions.filter(a => a.requires_evidence);
    const actionsWithEvidence = actionsRequiringEvidence.filter(
      a => a.evidence && a.evidence.length > 0
    );
    const verifiedEvidence = actionsRequiringEvidence.filter(
      a => a.evidence && a.evidence.some(e => e.verified_at)
    );

    // Time metrics
    const estimatedHours = actions.reduce((sum, a) => sum + (a.estimated_hours || 0), 0);
    const actualHours = actions.reduce((sum, a) => sum + (a.actual_hours || 0), 0);

    // Timeline
    const daysRemaining = plan.target_date
      ? differenceInDays(new Date(plan.target_date), new Date())
      : null;

    // Status breakdown
    const byStatus: Record<ActionStatus, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      in_review: 0,
      blocked: 0,
      completed: 0,
      cancelled: 0,
    };
    actions.forEach(a => {
      byStatus[a.status]++;
    });

    return {
      total,
      completed,
      blocked,
      inProgress,
      overdue,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      actionsRequiringEvidence: actionsRequiringEvidence.length,
      actionsWithEvidence: actionsWithEvidence.length,
      verifiedEvidence: verifiedEvidence.length,
      estimatedHours,
      actualHours,
      daysRemaining,
      byStatus,
    };
  }, [plan, actions]);

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'text-success';
    if (percent >= 50) return 'text-primary';
    if (percent >= 25) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress Report
            </CardTitle>
            <CardDescription>
              Detailed metrics for {plan.plan_ref}
            </CardDescription>
          </div>
          <div className={cn('text-3xl font-bold', getProgressColor(metrics.progressPercent))}>
            {metrics.progressPercent}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{metrics.completed} / {metrics.total} actions</span>
          </div>
          <Progress value={metrics.progressPercent} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Completed
            </div>
            <div className="text-xl font-semibold">{metrics.completed}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              In Progress
            </div>
            <div className="text-xl font-semibold">{metrics.inProgress}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-error" />
              Blocked
            </div>
            <div className="text-xl font-semibold">{metrics.blocked}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-orange-500" />
              Overdue
            </div>
            <div className="text-xl font-semibold">{metrics.overdue}</div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Status Breakdown</h4>
          <div className="space-y-2">
            {[
              { status: 'backlog' as const, label: 'Backlog', color: 'bg-muted' },
              { status: 'todo' as const, label: 'To Do', color: 'bg-blue-500' },
              { status: 'in_progress' as const, label: 'In Progress', color: 'bg-primary' },
              { status: 'in_review' as const, label: 'In Review', color: 'bg-purple-500' },
              { status: 'blocked' as const, label: 'Blocked', color: 'bg-error' },
              { status: 'completed' as const, label: 'Completed', color: 'bg-success' },
            ].map(({ status, label, color }) => {
              const count = metrics.byStatus[status];
              const percent = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-muted-foreground">{label}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', color)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs text-right font-medium">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Collection */}
        {metrics.actionsRequiringEvidence > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              Evidence Collection
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{metrics.actionsRequiringEvidence}</div>
                <div className="text-xs text-muted-foreground">Required</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{metrics.actionsWithEvidence}</div>
                <div className="text-xs text-muted-foreground">Uploaded</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{metrics.verifiedEvidence}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Evidence Progress</span>
                <span>
                  {Math.round((metrics.actionsWithEvidence / metrics.actionsRequiringEvidence) * 100)}%
                </span>
              </div>
              <Progress
                value={(metrics.actionsWithEvidence / metrics.actionsRequiringEvidence) * 100}
                className="h-1.5"
              />
            </div>
          </div>
        )}

        {/* Time Tracking */}
        {metrics.estimatedHours > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Time Tracking
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{metrics.estimatedHours}h</div>
                <div className="text-xs text-muted-foreground">Estimated</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className={cn(
                  'text-lg font-semibold',
                  metrics.actualHours > metrics.estimatedHours && 'text-error'
                )}>
                  {metrics.actualHours}h
                </div>
                <div className="text-xs text-muted-foreground">Actual</div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {metrics.daysRemaining !== null && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Target Date:</span>
              <span className="font-medium">
                {format(new Date(plan.target_date!), 'MMM d, yyyy')}
              </span>
            </div>
            <Badge
              variant={metrics.daysRemaining < 0 ? 'destructive' : 'secondary'}
              className={cn(
                'text-xs',
                metrics.daysRemaining > 0 && metrics.daysRemaining <= 7 && 'bg-yellow-500/10 text-yellow-600'
              )}
            >
              {metrics.daysRemaining < 0
                ? `${Math.abs(metrics.daysRemaining)} days overdue`
                : metrics.daysRemaining === 0
                ? 'Due today'
                : `${metrics.daysRemaining} days remaining`
              }
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
