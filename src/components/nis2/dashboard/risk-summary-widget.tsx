'use client';

/**
 * Risk Summary Widget
 *
 * A compact widget showing NIS2 risk register summary for the dashboard.
 */

import Link from 'next/link';
import { AlertTriangle, Target, ArrowRight, TrendingDown, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { RiskSummary } from '@/lib/nis2/types';

interface RiskSummaryWidgetProps {
  summary: RiskSummary | null;
  className?: string;
}

export function RiskSummaryWidget({ summary, className }: RiskSummaryWidgetProps) {
  // Handle empty state
  if (!summary || summary.total_risks === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            ICT Risk Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your NIS2 ICT risks
            </p>
            <Button asChild size="sm">
              <Link href="/nis2/risk-register/new">
                Add First Risk
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalHighCount = summary.critical_residual + summary.high_residual;
  const withinTolerance = summary.total_risks - criticalHighCount - (summary.not_assessed ?? 0);
  const tolerancePercentage = Math.round((withinTolerance / summary.total_risks) * 100);

  // Calculate risk reduction if we have both inherent and residual data
  const hasReduction = summary.avg_inherent_score !== null &&
    summary.avg_residual_score !== null &&
    summary.avg_inherent_score > 0;

  const reductionPercentage = hasReduction
    ? Math.round(((summary.avg_inherent_score! - summary.avg_residual_score!) / summary.avg_inherent_score!) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            ICT Risk Register
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link href="/nis2/risk-register" className="flex items-center gap-1">
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk counts */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <RiskCountBox
            count={summary.critical_residual}
            label="Critical"
            colorClass="text-red-600 bg-red-50"
          />
          <RiskCountBox
            count={summary.high_residual}
            label="High"
            colorClass="text-orange-600 bg-orange-50"
          />
          <RiskCountBox
            count={summary.medium_residual}
            label="Medium"
            colorClass="text-amber-600 bg-amber-50"
          />
          <RiskCountBox
            count={summary.low_residual}
            label="Low"
            colorClass="text-emerald-600 bg-emerald-50"
          />
        </div>

        {/* Tolerance progress */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Within tolerance
            </span>
            <span className="font-medium">{tolerancePercentage}%</span>
          </div>
          <Progress
            value={tolerancePercentage}
            className={cn(
              'h-2',
              tolerancePercentage >= 80 && '[&>div]:bg-emerald-500',
              tolerancePercentage >= 50 && tolerancePercentage < 80 && '[&>div]:bg-amber-500',
              tolerancePercentage < 50 && '[&>div]:bg-red-500'
            )}
          />
        </div>

        {/* Control effectiveness / reduction */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">Risk reduction</span>
          </div>
          <span className={cn(
            'text-sm font-medium',
            reductionPercentage > 0 ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            {reductionPercentage > 0 ? `-${reductionPercentage}%` : 'No controls'}
          </span>
        </div>

        {/* Heat map link */}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/nis2/heat-map" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            View Risk Heat Map
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface RiskCountBoxProps {
  count: number;
  label: string;
  colorClass: string;
}

function RiskCountBox({ count, label, colorClass }: RiskCountBoxProps) {
  return (
    <div className={cn('rounded-md py-2', colorClass.split(' ')[1])}>
      <div className={cn('text-lg font-bold', colorClass.split(' ')[0])}>
        {count}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
