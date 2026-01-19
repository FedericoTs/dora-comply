'use client';

import { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  Shield,
  FileCheck,
  TrendingUp,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import type { VendorStats } from '@/lib/vendors/types';

export type TimePeriod = '7d' | '30d' | '90d';

export interface VendorTrendData {
  total: number[];
  critical: number[];
  riskScore: number[];
  roiReady: number[];
  alerts: number[];
}

export interface VendorStatsDashboardProps {
  stats: VendorStats;
  trends?: VendorTrendData;
  trendDeltas?: {
    total: number;
    critical: number;
    riskScore: number;
    roiReady: number;
    alerts: number;
  };
  period?: TimePeriod;
  onPeriodChange?: (period: TimePeriod) => void;
  onStatClick?: (statType: string) => void;
  showBenchmark?: boolean;
  benchmarkPercentile?: number;
  className?: string;
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

/**
 * VendorStatsDashboard - Rich statistics dashboard with trends, sparklines, and interactivity
 *
 * Features:
 * - Clickable stats to filter vendor list
 * - Sparklines showing trends over time
 * - Trend indicators with delta values
 * - Period selector (7d/30d/90d)
 * - Optional peer benchmark comparison
 */
export function VendorStatsDashboard({
  stats,
  trends,
  trendDeltas,
  period = '30d',
  onPeriodChange,
  onStatClick,
  showBenchmark = false,
  benchmarkPercentile,
  className,
}: VendorStatsDashboardProps) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // Calculate risk grade from average score
  const getRiskGrade = (score: number | null): { grade: string; color: string } => {
    if (score === null) return { grade: '-', color: 'text-muted-foreground' };
    if (score <= 30) return { grade: 'A', color: 'text-emerald-500' };
    if (score <= 50) return { grade: 'B', color: 'text-lime-500' };
    if (score <= 70) return { grade: 'C', color: 'text-amber-500' };
    if (score <= 85) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const riskGrade = getRiskGrade(stats.avg_risk_score);

  // Calculate alerts count (high risk + pending)
  const alertsCount = stats.by_risk.critical + stats.by_risk.high + stats.pending_reviews;

  const statItems = [
    {
      id: 'total',
      label: 'Total',
      value: stats.total,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      sparklineData: trends?.total,
      delta: trendDeltas?.total,
      suffix: '',
      clickFilter: 'all',
    },
    {
      id: 'critical',
      label: 'Critical',
      value: stats.by_tier.critical,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      sparklineData: trends?.critical,
      delta: trendDeltas?.critical,
      suffix: '',
      clickFilter: 'tier:critical',
    },
    {
      id: 'riskGrade',
      label: 'Avg Risk',
      value: riskGrade.grade,
      subValue: stats.avg_risk_score !== null ? `(${stats.avg_risk_score})` : '',
      icon: Shield,
      color: riskGrade.color,
      bgColor: stats.avg_risk_score && stats.avg_risk_score > 60 ? 'bg-red-500/10' : 'bg-muted/50',
      borderColor: stats.avg_risk_score && stats.avg_risk_score > 60 ? 'border-red-500/20' : 'border-border',
      sparklineData: trends?.riskScore,
      delta: trendDeltas?.riskScore,
      suffix: '',
      invertTrend: true, // Lower is better for risk
      clickFilter: 'risk:high',
    },
    {
      id: 'roiReady',
      label: 'NIS2 Ready',
      value: stats.roi_ready_percentage,
      icon: FileCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      sparklineData: trends?.roiReady,
      delta: trendDeltas?.roiReady,
      suffix: '%',
      clickFilter: 'roi:ready',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      value: alertsCount,
      icon: TrendingUp,
      color: alertsCount > 0 ? 'text-amber-500' : 'text-muted-foreground',
      bgColor: alertsCount > 0 ? 'bg-amber-500/10' : 'bg-muted/50',
      borderColor: alertsCount > 0 ? 'border-amber-500/20' : 'border-border',
      sparklineData: trends?.alerts,
      delta: trendDeltas?.alerts,
      suffix: '',
      invertTrend: true, // Fewer alerts is better
      clickFilter: 'alerts',
    },
  ];

  return (
    <Card className={cn('card-premium', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          Vendor Overview
        </CardTitle>
        {onPeriodChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {PERIOD_LABELS[period]}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(PERIOD_LABELS) as TimePeriod[]).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={cn(p === period && 'bg-accent')}
                >
                  {PERIOD_LABELS[p]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statItems.map((stat) => (
            <TooltipProvider key={stat.id}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onStatClick?.(stat.clickFilter)}
                    onMouseEnter={() => setHoveredStat(stat.id)}
                    onMouseLeave={() => setHoveredStat(null)}
                    className={cn(
                      'relative flex flex-col rounded-lg border p-3 text-left transition-all',
                      'hover:border-primary/30 hover:shadow-sm',
                      stat.bgColor,
                      stat.borderColor,
                      hoveredStat === stat.id && 'ring-1 ring-primary/20'
                    )}
                  >
                    {/* Icon & Value Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <stat.icon className={cn('h-4 w-4', stat.color)} />
                        <span className={cn('text-2xl font-bold tabular-nums', stat.color)}>
                          {stat.value}
                          {stat.suffix}
                        </span>
                        {stat.subValue && (
                          <span className="text-xs text-muted-foreground">{stat.subValue}</span>
                        )}
                      </div>
                      {stat.delta !== undefined && stat.delta !== 0 && (
                        <TrendIndicator
                          value={stat.delta}
                          format="number"
                          size="xs"
                          invertColors={stat.invertTrend}
                          showIcon={false}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <span className="mt-1 text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </span>

                    {/* Sparkline */}
                    {stat.sparklineData && stat.sparklineData.length >= 2 && (
                      <div className="mt-2">
                        <Sparkline
                          data={stat.sparklineData}
                          width={80}
                          height={20}
                          color={stat.invertTrend ? 'auto' : 'primary'}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Trend badge for period */}
                    {stat.delta !== undefined && (
                      <span className="mt-1.5 text-[10px] text-muted-foreground">
                        {stat.delta > 0 ? '+' : ''}{stat.delta} this {period.replace('d', ' days').replace('7 days', 'week').replace('30 days', 'month').replace('90 days', 'quarter')}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Click to filter vendors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Benchmark Bar */}
        {showBenchmark && benchmarkPercentile !== undefined && (
          <div className="mt-4 rounded-lg bg-muted/30 px-4 py-2.5 border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Industry Benchmark:</span>
              <span className="font-medium">
                Your risk score is better than{' '}
                <span className="text-primary">{benchmarkPercentile}%</span> of peers
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * VendorStatsMini - Minimal stats row for compact spaces
 */
export interface VendorStatsMiniProps {
  stats: VendorStats;
  onStatClick?: (statType: string) => void;
  className?: string;
}

export function VendorStatsMini({ stats, onStatClick, className }: VendorStatsMiniProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      <button
        type="button"
        onClick={() => onStatClick?.('all')}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xl font-bold">{stats.total}</span>
        <span className="text-sm text-muted-foreground">vendors</span>
      </button>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => onStatClick?.('tier:critical')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-red-500/10 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="font-medium text-red-600 dark:text-red-400">
            {stats.by_tier.critical}
          </span>
          <span className="text-muted-foreground">critical</span>
        </button>

        <button
          type="button"
          onClick={() => onStatClick?.('tier:important')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-amber-500/10 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {stats.by_tier.important}
          </span>
          <span className="text-muted-foreground">important</span>
        </button>

        <button
          type="button"
          onClick={() => onStatClick?.('status:active')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-emerald-500/10 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {stats.by_status.active}
          </span>
          <span className="text-muted-foreground">active</span>
        </button>
      </div>

      <div className="h-4 w-px bg-border" />

      <button
        type="button"
        onClick={() => onStatClick?.('roi:ready')}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-primary/10 transition-colors"
      >
        <FileCheck className="h-4 w-4 text-primary" />
        <span className="font-medium">{stats.roi_ready_percentage}%</span>
        <span className="text-sm text-muted-foreground">NIS2 ready</span>
      </button>
    </div>
  );
}
