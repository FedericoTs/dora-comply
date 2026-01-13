'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IncidentStatsEnhanced } from '@/lib/incidents/types';
import { IncidentTrendSparkline } from './incident-trend-sparkline';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

interface IncidentMetricsCardProps {
  stats: IncidentStatsEnhanced;
  className?: string;
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  // For incidents, more is bad, so we invert the color logic
  return diff > 0 ? (
    <TrendingUp className="h-3 w-3 text-error" />
  ) : (
    <TrendingDown className="h-3 w-3 text-success" />
  );
}

export function IncidentMetricsCard({ stats, className }: IncidentMetricsCardProps) {
  const activeIncidents = stats.total - stats.by_status.closed;
  const majorCount = stats.by_classification.major;
  const significantCount = stats.by_classification.significant;

  // Calculate 7-day trend
  const last7Days = stats.trend_30d.slice(-7);
  const prev7Days = stats.trend_30d.slice(-14, -7);
  const last7Total = last7Days.reduce((sum, d) => sum + d.total, 0);
  const prev7Total = prev7Days.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className={cn('card-elevated', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{activeIncidents}</p>
                <TrendIndicator current={last7Total} previous={prev7Total} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Active Incidents
                <HelpTooltip content={KPI_HELP.activeIncidents} iconClassName="h-3 w-3" />
              </p>
            </div>
          </div>

          {/* Sparkline */}
          <div className="pt-1">
            <IncidentTrendSparkline data={stats.trend_30d} />
          </div>
        </div>

        {/* Classification breakdown */}
        <div className="mt-4 flex gap-3">
          {majorCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <span className="font-semibold">{majorCount}</span> Major
            </Badge>
          )}
          {significantCount > 0 && (
            <Badge variant="outline" className="gap-1 text-xs border-warning/50 text-warning">
              <span className="font-semibold">{significantCount}</span> Significant
            </Badge>
          )}
          {stats.pending_reports > 0 && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className="font-semibold">{stats.pending_reports}</span> pending
            </Badge>
          )}
        </div>

        {/* Response metrics summary */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {stats.response_metrics.on_time_report_rate >= 90 ? (
              <CheckCircle className="h-3 w-3 text-success" />
            ) : stats.response_metrics.on_time_report_rate >= 70 ? (
              <Clock className="h-3 w-3 text-warning" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-error" />
            )}
            <span className="text-muted-foreground">
              On-time rate:{' '}
              <span
                className={cn(
                  'font-medium',
                  stats.response_metrics.on_time_report_rate >= 90
                    ? 'text-success'
                    : stats.response_metrics.on_time_report_rate >= 70
                    ? 'text-warning'
                    : 'text-error'
                )}
              >
                {stats.response_metrics.on_time_report_rate}%
              </span>
            </span>
          </div>
          {stats.overdue_reports > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {stats.overdue_reports} overdue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
