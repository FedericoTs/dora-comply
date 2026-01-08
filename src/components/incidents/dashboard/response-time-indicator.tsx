'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResponseMetrics } from '@/lib/incidents/types';

interface ResponseTimeIndicatorProps {
  metrics: ResponseMetrics;
  className?: string;
}

function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function getDetectionStatus(hours: number | null): { color: string; label: string } {
  if (hours === null) return { color: 'text-muted-foreground', label: 'No data' };
  if (hours <= 1) return { color: 'text-success', label: 'Excellent' };
  if (hours <= 4) return { color: 'text-info', label: 'Good' };
  if (hours <= 12) return { color: 'text-warning', label: 'Average' };
  return { color: 'text-error', label: 'Slow' };
}

function getResolutionStatus(hours: number | null): { color: string; label: string } {
  if (hours === null) return { color: 'text-muted-foreground', label: 'No data' };
  if (hours <= 4) return { color: 'text-success', label: 'Excellent' };
  if (hours <= 24) return { color: 'text-info', label: 'Good' };
  if (hours <= 72) return { color: 'text-warning', label: 'Average' };
  return { color: 'text-error', label: 'Extended' };
}

export function ResponseTimeIndicator({ metrics, className }: ResponseTimeIndicatorProps) {
  const detectionStatus = getDetectionStatus(metrics.mean_time_to_detect_hours);
  const resolutionStatus = getResolutionStatus(metrics.mean_time_to_resolve_hours);

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Response Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mean Time to Detect */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Mean Time to Detect
            </span>
            <Badge variant="outline" className={cn('text-xs', detectionStatus.color)}>
              {detectionStatus.label}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', detectionStatus.color)}>
              {formatHours(metrics.mean_time_to_detect_hours)}
            </span>
            <span className="text-xs text-muted-foreground">avg detection time</span>
          </div>
        </div>

        {/* Mean Time to Resolve */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Mean Time to Resolve
            </span>
            <Badge variant="outline" className={cn('text-xs', resolutionStatus.color)}>
              {resolutionStatus.label}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', resolutionStatus.color)}>
              {formatHours(metrics.mean_time_to_resolve_hours)}
            </span>
            <span className="text-xs text-muted-foreground">avg resolution time</span>
          </div>
        </div>

        {/* Report Compliance */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Report Compliance (DORA Art. 19)</span>
            <span
              className={cn(
                'text-sm font-medium',
                metrics.on_time_report_rate >= 90
                  ? 'text-success'
                  : metrics.on_time_report_rate >= 70
                  ? 'text-warning'
                  : 'text-error'
              )}
            >
              {metrics.on_time_report_rate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                metrics.on_time_report_rate >= 90
                  ? 'bg-success'
                  : metrics.on_time_report_rate >= 70
                  ? 'bg-warning'
                  : 'bg-error'
              )}
              style={{ width: `${metrics.on_time_report_rate}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-success" />
              {metrics.reports_on_time} on time
            </span>
            {metrics.reports_late > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-error" />
                {metrics.reports_late} late
              </span>
            )}
          </div>
        </div>

        {/* DORA Deadline References */}
        <div className="pt-2 text-[10px] text-muted-foreground">
          <p>DORA Deadlines: Initial 4h | Intermediate 72h | Final 30d</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboard stat card
 */
export function ResponseTimeCompact({ metrics }: { metrics: ResponseMetrics }) {
  const detectionStatus = getDetectionStatus(metrics.mean_time_to_detect_hours);

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-info/10 p-2">
        <Clock className="h-5 w-5 text-info" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className={cn('text-2xl font-bold', detectionStatus.color)}>
            {formatHours(metrics.mean_time_to_detect_hours)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Avg. Detection</p>
      </div>
    </div>
  );
}
