'use client';

/**
 * Deadline Tracker Component
 *
 * Enhanced countdown with pace analysis and projections
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  analyzePace,
  getPaceStatusMessage,
  DORA_DEADLINE,
  type PaceAnalysis,
  type ProgressSnapshot,
} from '@/lib/roi/pace-calculator';

interface DeadlineTrackerProps {
  currentCompletion: number;
  totalFields: number;
  progressHistory?: ProgressSnapshot[];
  deadline?: Date;
  className?: string;
}

export function DeadlineTracker({
  currentCompletion,
  totalFields,
  progressHistory = [],
  deadline = DORA_DEADLINE,
  className,
}: DeadlineTrackerProps) {
  const [paceAnalysis, setPaceAnalysis] = useState<PaceAnalysis | null>(null);

  useEffect(() => {
    const analysis = analyzePace(progressHistory, totalFields, deadline);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaceAnalysis(analysis);
  }, [progressHistory, totalFields, deadline]);

  const today = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const completionPercent = totalFields > 0 ? Math.round((currentCompletion / totalFields) * 100) : 0;

  const getTrendIcon = () => {
    if (!paceAnalysis) return <Minus className="h-4 w-4" />;

    switch (paceAnalysis.trend) {
      case 'accelerating':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'slowing':
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      case 'stalled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    if (!paceAnalysis) return 'text-muted-foreground';
    if (paceAnalysis.onTrack) return 'text-green-600';
    if (paceAnalysis.daysAhead < -14) return 'text-red-600';
    return 'text-amber-600';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            DORA Deadline
          </CardTitle>
          {paceAnalysis && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant={paceAnalysis.onTrack ? 'default' : 'secondary'}
                    className={cn(
                      'gap-1',
                      paceAnalysis.onTrack
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : paceAnalysis.daysAhead < -14
                        ? 'bg-red-100 text-red-700 hover:bg-red-100'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    )}
                  >
                    {getTrendIcon()}
                    {paceAnalysis.onTrack ? 'On Track' : 'Behind'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getPaceStatusMessage(paceAnalysis)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription>
          {deadline.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Days Remaining */}
        <div className="text-center py-2">
          <div className={cn('text-4xl font-bold', getStatusColor())}>
            {daysRemaining > 0 ? daysRemaining : 'Overdue'}
          </div>
          <p className="text-sm text-muted-foreground">
            {daysRemaining > 0 ? 'days remaining' : 'submission required'}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        {/* Pace Metrics */}
        {paceAnalysis && paceAnalysis.currentPace > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Pace</p>
              <p className="text-sm font-medium">
                {paceAnalysis.currentPace.toFixed(1)}{' '}
                <span className="text-xs text-muted-foreground">fields/day</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Required Pace</p>
              <p className={cn(
                'text-sm font-medium',
                paceAnalysis.currentPace < paceAnalysis.requiredPace && 'text-amber-600'
              )}>
                {paceAnalysis.requiredPace.toFixed(1)}{' '}
                <span className="text-xs text-muted-foreground">fields/day</span>
              </p>
            </div>
          </div>
        )}

        {/* Projected Completion */}
        {paceAnalysis?.projectedCompletion && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Projected Completion</span>
              </div>
              <span className={cn(
                'text-sm font-medium',
                paceAnalysis.daysAhead >= 0 ? 'text-green-600' : 'text-amber-600'
              )}>
                {paceAnalysis.projectedCompletion.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            {paceAnalysis.daysAhead !== 0 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {paceAnalysis.daysAhead > 0
                  ? `${Math.round(paceAnalysis.daysAhead)} days early`
                  : `${Math.abs(Math.round(paceAnalysis.daysAhead))} days late`}
              </p>
            )}
          </div>
        )}

        {/* Low confidence warning */}
        {paceAnalysis && paceAnalysis.confidence < 0.5 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            <Clock className="h-3 w-3" />
            <span>More progress data needed for accurate projections</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
