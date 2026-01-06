'use client';

/**
 * Milestone List Component
 *
 * Track progress against key milestones
 */

import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getMilestonesWithStatus,
  formatDaysRemaining,
  type Milestone,
} from '@/lib/roi/pace-calculator';

interface MilestoneListProps {
  currentCompletion: number;
  customMilestones?: Omit<Milestone, 'actualCompletion' | 'status'>[];
  onMilestoneClick?: (milestone: Milestone) => void;
  showAll?: boolean;
  className?: string;
}

const statusConfig: Record<Milestone['status'], {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  badgeClass: string;
  label: string;
}> = {
  completed: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-100 text-green-700',
    label: 'Completed',
  },
  on_track: {
    icon: Circle,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    label: 'On Track',
  },
  at_risk: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
    label: 'At Risk',
  },
  missed: {
    icon: XCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700',
    label: 'Missed',
  },
  upcoming: {
    icon: Clock,
    iconClass: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground',
    label: 'Upcoming',
  },
};

export function MilestoneList({
  currentCompletion,
  customMilestones,
  onMilestoneClick,
  showAll = false,
  className,
}: MilestoneListProps) {
  const milestones = getMilestonesWithStatus(currentCompletion, customMilestones);

  // If not showing all, only show next 3 and any at-risk/missed
  const filteredMilestones = showAll
    ? milestones
    : milestones.filter((m, i) => {
        if (m.status === 'at_risk' || m.status === 'missed') return true;
        if (m.status === 'completed') return i === milestones.findIndex(x => x.status === 'completed');
        const upcomingIndex = milestones.findIndex(x => x.status !== 'completed');
        return i >= upcomingIndex && i < upcomingIndex + 3;
      });

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const atRiskCount = milestones.filter(m => m.status === 'at_risk' || m.status === 'missed').length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            Milestones
          </CardTitle>
          <div className="flex items-center gap-2">
            {atRiskCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {atRiskCount} at risk
              </Badge>
            )}
            <Badge variant="secondary">
              {completedCount}/{milestones.length}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Key checkpoints for RoI completion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Overview */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round((completedCount / milestones.length) * 100)}%</span>
          </div>
          <Progress
            value={(completedCount / milestones.length) * 100}
            className="h-1.5"
          />
        </div>

        {/* Milestone Items */}
        <div className="space-y-2 pt-2">
          {filteredMilestones.map((milestone, index) => {
            const config = statusConfig[milestone.status];
            const Icon = config.icon;
            const today = new Date();
            const daysUntil = Math.ceil(
              (milestone.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={milestone.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  milestone.status === 'at_risk' && 'border-amber-200 bg-amber-50/50',
                  milestone.status === 'missed' && 'border-red-200 bg-red-50/50',
                  onMilestoneClick && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                {/* Status Icon with Timeline */}
                <div className="flex flex-col items-center">
                  <Icon className={cn('h-5 w-5', config.iconClass)} />
                  {index < filteredMilestones.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-full min-h-[20px] mt-1',
                      milestone.status === 'completed' ? 'bg-green-200' : 'bg-border'
                    )} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{milestone.name}</p>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('shrink-0 text-[10px]', config.badgeClass)}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Target: {milestone.targetCompletion}%</span>
                      <span>Current: {milestone.actualCompletion}%</span>
                    </div>
                    <Progress
                      value={(milestone.actualCompletion! / milestone.targetCompletion) * 100}
                      className={cn(
                        'h-1',
                        milestone.status === 'completed' && '[&>div]:bg-green-500',
                        milestone.status === 'at_risk' && '[&>div]:bg-amber-500',
                        milestone.status === 'missed' && '[&>div]:bg-red-500'
                      )}
                    />
                  </div>

                  {/* Date */}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      Due: {milestone.targetDate.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {milestone.status !== 'completed' && (
                      <span className={cn(
                        daysUntil < 0 && 'text-red-600',
                        daysUntil <= 7 && daysUntil >= 0 && 'text-amber-600'
                      )}>
                        {formatDaysRemaining(daysUntil)}
                      </span>
                    )}
                  </div>
                </div>

                {onMilestoneClick && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Show All Toggle */}
        {!showAll && milestones.length > filteredMilestones.length && (
          <Button variant="ghost" size="sm" className="w-full">
            View all {milestones.length} milestones
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact milestone progress bar
 */
interface MilestoneProgressBarProps {
  currentCompletion: number;
  className?: string;
}

export function MilestoneProgressBar({ currentCompletion, className }: MilestoneProgressBarProps) {
  const milestones = getMilestonesWithStatus(currentCompletion);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Progress bar */}
        <div
          className="absolute h-full bg-primary rounded-full transition-all"
          style={{ width: `${currentCompletion}%` }}
        />

        {/* Milestone markers */}
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background',
              milestone.status === 'completed'
                ? 'bg-green-500'
                : milestone.status === 'at_risk' || milestone.status === 'missed'
                ? 'bg-amber-500'
                : 'bg-muted-foreground'
            )}
            style={{ left: `${milestone.targetCompletion}%`, marginLeft: '-4px' }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
