'use client';

/**
 * Pace Analysis Component
 *
 * Visual representation of completion velocity and trends
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ProgressSnapshot, PaceAnalysis } from '@/lib/roi/pace-calculator';

interface PaceAnalysisProps {
  analysis: PaceAnalysis;
  history: ProgressSnapshot[];
  className?: string;
}

export function PaceAnalysisCard({ analysis, history, className }: PaceAnalysisProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return history
      .filter(h => h.date >= cutoff)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history, period]);

  const getTrendBadge = () => {
    const config = {
      accelerating: { icon: TrendingUp, label: 'Accelerating', class: 'bg-success/20 text-success' },
      steady: { icon: Minus, label: 'Steady', class: 'bg-info/20 text-info' },
      slowing: { icon: TrendingDown, label: 'Slowing', class: 'bg-warning/20 text-warning' },
      stalled: { icon: AlertTriangle, label: 'Stalled', class: 'bg-error/20 text-error' },
    };

    const { icon: Icon, label, class: className } = config[analysis.trend];

    return (
      <Badge variant="secondary" className={cn('gap-1', className)}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Calculate daily completion chart data
  const chartData = useMemo(() => {
    if (filteredHistory.length < 2) return [];

    return filteredHistory.map((snapshot, index) => {
      const prev = index > 0 ? filteredHistory[index - 1] : snapshot;
      const fieldsDelta = snapshot.completedFields - prev.completedFields;

      return {
        date: snapshot.date,
        completed: snapshot.completedFields,
        delta: fieldsDelta,
        errors: snapshot.errorCount,
      };
    });
  }, [filteredHistory]);

  const maxDelta = Math.max(...chartData.map(d => d.delta), 1);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Pace Analysis
          </CardTitle>
          {getTrendBadge()}
        </div>
        <CardDescription>
          Track your completion velocity over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-4">
            {/* Pace Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {analysis.currentPace.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Fields/Day</p>
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-2xl font-bold',
                  analysis.currentPace >= analysis.requiredPace
                    ? 'text-success'
                    : 'text-warning'
                )}>
                  {analysis.requiredPace.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Required</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round(analysis.confidence * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>

            {/* Simple Bar Chart */}
            {chartData.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Daily Progress</span>
                  <span>Fields Completed</span>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {chartData.slice(-14).map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t transition-all',
                          data.delta > 0
                            ? 'bg-primary hover:bg-primary/80'
                            : 'bg-muted'
                        )}
                        style={{
                          height: `${Math.max(4, (data.delta / maxDelta) * 100)}%`,
                        }}
                      />
                      <span className="text-[8px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.delta}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    {chartData[Math.max(0, chartData.length - 14)]?.date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span>
                    {chartData[chartData.length - 1]?.date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Not enough data to show trends
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete more fields to see your progress chart
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Insights */}
        {analysis.currentPace > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium">Insights</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {analysis.onTrack ? (
                <li className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  You&apos;re on track to meet the deadline
                </li>
              ) : (
                <li className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Increase pace by {(analysis.requiredPace - analysis.currentPace).toFixed(1)} fields/day
                </li>
              )}
              {analysis.trend === 'accelerating' && (
                <li className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                  Your completion rate is increasing
                </li>
              )}
              {analysis.trend === 'slowing' && (
                <li className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Your completion rate is decreasing
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
