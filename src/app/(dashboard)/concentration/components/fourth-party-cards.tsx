'use client';

import { AlertTriangle, Link2, Eye, EyeOff, Layers, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AggregateChainMetrics } from '@/lib/concentration/chain-utils';
import { CONCENTRATION_THRESHOLDS } from '@/lib/concentration/types';

interface FourthPartyCardsProps {
  metrics: AggregateChainMetrics;
  className?: string;
}

export function FourthPartyCards({ metrics, className }: FourthPartyCardsProps) {
  const hasDeepChain = metrics.maxChainDepth > CONCENTRATION_THRESHOLDS.max_chain_depth_warning;
  const hasCriticalDepth = metrics.maxChainDepth > CONCENTRATION_THRESHOLDS.max_chain_depth_critical;

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {/* Total Fourth Parties */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
          <Link2 className="w-full h-full" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fourth Parties
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.totalFourthParties}</span>
            <span className="text-sm text-muted-foreground">
              across {metrics.vendorsWithChains} vendors
            </span>
          </div>
          {metrics.totalFourthParties > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Avg. {(metrics.totalFourthParties / Math.max(metrics.vendorsWithChains, 1)).toFixed(1)} per vendor
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chain Depth */}
      <Card className={cn(
        'relative overflow-hidden',
        hasCriticalDepth && 'border-destructive/50 bg-destructive/5',
        hasDeepChain && !hasCriticalDepth && 'border-warning/50 bg-warning/5'
      )}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
          <Layers className="w-full h-full" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Layers className={cn(
              'h-4 w-4',
              hasCriticalDepth && 'text-destructive',
              hasDeepChain && !hasCriticalDepth && 'text-warning',
              !hasDeepChain && 'text-muted-foreground'
            )} />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Chain Depth
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-bold',
              hasCriticalDepth && 'text-destructive',
              hasDeepChain && !hasCriticalDepth && 'text-warning'
            )}>
              {metrics.maxChainDepth}
            </span>
            <span className="text-sm text-muted-foreground">levels</span>
            {hasDeepChain && (
              <Badge
                variant={hasCriticalDepth ? 'destructive' : 'secondary'}
                className={cn('ml-auto', !hasCriticalDepth && 'bg-warning/20 text-warning-foreground border-warning/30')}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {hasCriticalDepth ? 'Critical' : 'Warning'}
              </Badge>
            )}
          </div>
          {metrics.deepestVendorName && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              Via {metrics.deepestVendorName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monitoring Coverage */}
      <Card className={cn(
        'relative overflow-hidden',
        metrics.unmonitoredCount > 5 && 'border-warning/50 bg-warning/5'
      )}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
          {metrics.unmonitoredCount > 0 ? (
            <EyeOff className="w-full h-full" />
          ) : (
            <Eye className="w-full h-full" />
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {metrics.unmonitoredCount > 0 ? (
              <EyeOff className="h-4 w-4 text-warning" />
            ) : (
              <Eye className="h-4 w-4 text-success" />
            )}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unmonitored
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-bold',
              metrics.unmonitoredCount > 5 && 'text-warning',
              metrics.unmonitoredCount === 0 && 'text-success'
            )}>
              {metrics.unmonitoredCount}
            </span>
            <span className="text-sm text-muted-foreground">subcontractors</span>
          </div>
          {metrics.totalSubcontractors > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(((metrics.totalSubcontractors - metrics.unmonitoredCount) / metrics.totalSubcontractors) * 100)}% coverage
            </p>
          )}
        </CardContent>
      </Card>

      {/* Critical at Depth */}
      <Card className={cn(
        'relative overflow-hidden',
        metrics.criticalAtDepth > 0 && 'border-destructive/50 bg-destructive/5'
      )}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
          <TrendingUp className="w-full h-full" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className={cn(
              'h-4 w-4',
              metrics.criticalAtDepth > 0 ? 'text-destructive' : 'text-muted-foreground'
            )} />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical at Depth
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-bold',
              metrics.criticalAtDepth > 0 && 'text-destructive'
            )}>
              {metrics.criticalAtDepth}
            </span>
            <span className="text-sm text-muted-foreground">vendors</span>
            {metrics.criticalAtDepth > 0 && (
              <Badge variant="destructive" className="ml-auto">
                Risk
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Critical functions at tier 3+
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
