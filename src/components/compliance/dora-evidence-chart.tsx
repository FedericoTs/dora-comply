'use client';

/**
 * DORA Evidence Coverage Chart
 *
 * Displays how many DORA requirements have evidence from SOC 2:
 * - Sufficient: Full coverage from SOC 2 controls
 * - Partial: Some coverage but gaps exist
 * - Insufficient: No SOC 2 mapping available
 *
 * This replaces the misleading "100% SOC 2 Effective" metric
 * with actionable DORA compliance visibility.
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DORAEvidenceChartProps {
  sufficient: number;
  partial: number;
  insufficient: number;
  total: number;
  overallPercentage: number;
  criticalGapsCount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  sufficient: 'hsl(var(--success))',
  partial: 'hsl(var(--warning))',
  insufficient: 'hsl(var(--destructive))',
};

export function DORAEvidenceChart({
  sufficient,
  partial,
  insufficient,
  total,
  overallPercentage,
  criticalGapsCount,
  className,
  size = 'md',
}: DORAEvidenceChartProps) {
  const data = [
    { name: 'Sufficient Evidence', value: sufficient, color: COLORS.sufficient },
    { name: 'Partial Evidence', value: partial, color: COLORS.partial },
    { name: 'Insufficient Evidence', value: insufficient, color: COLORS.insufficient },
  ].filter(d => d.value > 0);

  const chartSize = size === 'sm' ? 180 : size === 'md' ? 240 : 300;
  const innerRadius = size === 'sm' ? 50 : size === 'md' ? 70 : 90;
  const outerRadius = size === 'sm' ? 70 : size === 'md' ? 95 : 120;

  // Determine overall status color
  const getStatusColor = () => {
    if (overallPercentage >= 70) return 'text-success';
    if (overallPercentage >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              DORA Requirement Coverage
            </CardTitle>
            <CardDescription>
              Evidence availability for 45 DORA requirements
            </CardDescription>
          </div>
          {criticalGapsCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalGapsCount} Critical Gaps
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative" style={{ width: chartSize, height: chartSize }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = Math.round((data.value / total) * 100);
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-muted-foreground">
                            {data.value} requirements ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', getStatusColor())}>
                {overallPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">Covered</span>
            </div>
          </div>

          {/* Legend / Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="font-medium">Sufficient Evidence</p>
                <p className="text-sm text-muted-foreground">
                  Requirements fully covered by SOC 2
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-success">{sufficient}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((sufficient / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              partial > 0 ? 'bg-warning/10' : 'bg-muted/30'
            )}>
              <AlertTriangle className={cn('h-5 w-5', partial > 0 ? 'text-warning' : 'text-muted-foreground')} />
              <div className="flex-1">
                <p className="font-medium">Partial Evidence</p>
                <p className="text-sm text-muted-foreground">
                  Some SOC 2 coverage, gaps remain
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  partial > 0 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {partial}
                </p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((partial / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              insufficient > 0 ? 'bg-destructive/10' : 'bg-muted/30'
            )}>
              <XCircle className={cn('h-5 w-5', insufficient > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              <div className="flex-1">
                <p className="font-medium">No SOC 2 Coverage</p>
                <p className="text-sm text-muted-foreground">
                  Requirements need additional evidence
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  insufficient > 0 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {insufficient}
                </p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((insufficient / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total DORA Requirements</span>
                <span className="text-lg font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
