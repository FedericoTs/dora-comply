'use client';

/**
 * Control Status Chart Component
 *
 * Displays SOC 2 control test results as a donut chart
 * with breakdown by status: Operating Effectively, Exception, Not Tested
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ControlStatusChartProps {
  operatingEffectively: number;
  withExceptions: number;
  notTested: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  effective: 'hsl(var(--success))',
  exception: 'hsl(var(--warning))',
  notTested: 'hsl(var(--muted))',
};

export function ControlStatusChart({
  operatingEffectively,
  withExceptions,
  notTested,
  className,
  size = 'md',
}: ControlStatusChartProps) {
  const total = operatingEffectively + withExceptions + notTested;
  const effectivePercentage = total > 0 ? Math.round((operatingEffectively / total) * 100) : 0;

  const data = [
    { name: 'Operating Effectively', value: operatingEffectively, color: COLORS.effective },
    { name: 'With Exceptions', value: withExceptions, color: COLORS.exception },
    { name: 'Not Tested', value: notTested, color: COLORS.notTested },
  ].filter(d => d.value > 0);

  const chartSize = size === 'sm' ? 180 : size === 'md' ? 240 : 300;
  const innerRadius = size === 'sm' ? 50 : size === 'md' ? 70 : 90;
  const outerRadius = size === 'sm' ? 70 : size === 'md' ? 95 : 120;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Control Test Results</CardTitle>
        <CardDescription>
          Distribution of SOC 2 control testing outcomes
        </CardDescription>
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
                            {data.value} controls ({percentage}%)
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
              <span className="text-3xl font-bold text-success">{effectivePercentage}%</span>
              <span className="text-xs text-muted-foreground">Effective</span>
            </div>
          </div>

          {/* Legend / Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <div className="w-3 h-3 rounded-full bg-success" />
              <div className="flex-1">
                <p className="font-medium">Operating Effectively</p>
                <p className="text-sm text-muted-foreground">
                  Controls tested and working as designed
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-success">{operatingEffectively}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((operatingEffectively / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              withExceptions > 0 ? 'bg-warning/10' : 'bg-muted/30'
            )}>
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="flex-1">
                <p className="font-medium">With Exceptions</p>
                <p className="text-sm text-muted-foreground">
                  Controls with identified deficiencies
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  withExceptions > 0 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {withExceptions}
                </p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((withExceptions / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Not Tested</p>
                <p className="text-sm text-muted-foreground">
                  Controls not included in testing scope
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-muted-foreground">{notTested}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((notTested / total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Controls</span>
                <span className="text-lg font-bold">{total}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
