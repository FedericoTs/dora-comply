'use client';

import {
  Building2,
  Globe2,
  Layers,
  Link2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ConcentrationMetrics } from '@/lib/concentration/types';
import { SERVICE_TYPE_LABELS } from '@/lib/concentration/types';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

interface MetricsGridProps {
  metrics: ConcentrationMetrics;
  className?: string;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MetricCardProps {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  tooltip?: string;
}

function MetricCard({
  title,
  icon: Icon,
  iconColor = 'text-primary',
  children,
  action,
  className,
  tooltip,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg bg-muted/50')}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
            {title}
            {tooltip && <HelpTooltip content={tooltip} iconClassName="h-3.5 w-3.5" />}
          </h4>
        </div>
      </div>

      <div className="space-y-3">{children}</div>

      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full text-xs"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  const topServiceName =
    SERVICE_TYPE_LABELS[metrics.top_service] || metrics.top_service || 'N/A';

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Vendor Distribution */}
      <MetricCard
        title="Vendor Distribution"
        icon={Building2}
        iconColor="text-blue-500"
        tooltip={KPI_HELP.totalVendors}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold">{metrics.total_vendors}</span>
            <span className="text-sm text-muted-foreground">total vendors</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Critical
              </span>
              <span className="font-medium">{metrics.critical_vendors}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Important
              </span>
              <span className="font-medium">{metrics.important_vendors}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Standard
              </span>
              <span className="font-medium">{metrics.standard_vendors}</span>
            </div>
          </div>
        </div>
      </MetricCard>

      {/* Service Concentration (HHI) */}
      <MetricCard
        title="Service Diversity"
        icon={Layers}
        iconColor="text-purple-500"
        tooltip={KPI_HELP.hhi}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono">
              {metrics.service_hhi.toFixed(2)}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                'uppercase text-[10px]',
                metrics.service_concentration_level === 'low' &&
                  'bg-green-100 text-green-700',
                metrics.service_concentration_level === 'moderate' &&
                  'bg-yellow-100 text-yellow-700',
                metrics.service_concentration_level === 'high' &&
                  'bg-red-100 text-red-700'
              )}
            >
              {metrics.service_concentration_level}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            Herfindahl-Hirschman Index
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm">Top Service</span>
              <span className="text-sm font-medium">{topServiceName}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Concentration</span>
              <span className="text-sm font-medium">{metrics.top_service_percentage}%</span>
            </div>
          </div>
        </div>
      </MetricCard>

      {/* Spend Concentration */}
      <MetricCard
        title="Spend Concentration"
        icon={DollarSign}
        iconColor={metrics.spend_concentration_level === 'high' ? 'text-red-500' : 'text-green-500'}
        tooltip="Herfindahl-Hirschman Index based on annual contract values. High concentration (>0.25) indicates over-reliance on few vendors."
      >
        <div className="space-y-3">
          {metrics.vendors_with_spend_data > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono">
                  {metrics.spend_hhi.toFixed(2)}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'uppercase text-[10px]',
                    metrics.spend_concentration_level === 'low' &&
                      'bg-green-100 text-green-700',
                    metrics.spend_concentration_level === 'moderate' &&
                      'bg-yellow-100 text-yellow-700',
                    metrics.spend_concentration_level === 'high' &&
                      'bg-red-100 text-red-700'
                  )}
                >
                  {metrics.spend_concentration_level}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                {formatCurrency(metrics.total_annual_spend, metrics.spend_currency)} total annual spend
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Top Vendor</span>
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {metrics.top_vendor_spend}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Share</span>
                  <span className={cn(
                    'text-sm font-medium',
                    metrics.top_vendor_spend_percentage > 30 && 'text-red-500'
                  )}>
                    {metrics.top_vendor_spend_percentage}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No spend data available</p>
              <p className="text-xs mt-1">Add contract values to enable spend analysis</p>
            </div>
          )}
        </div>
      </MetricCard>

      {/* Geographic Spread */}
      <MetricCard
        title="Geographic Spread"
        icon={Globe2}
        iconColor="text-emerald-500"
        tooltip={KPI_HELP.geographicSpread}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{metrics.eu_percentage}%</p>
              <p className="text-xs text-muted-foreground">EU</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-500">{metrics.non_eu_percentage}%</p>
              <p className="text-xs text-muted-foreground">Non-EU</p>
            </div>
          </div>

          <Progress value={metrics.eu_percentage} className="h-2" />

          <div className="pt-2 border-t space-y-1">
            {metrics.geographic_spread.slice(0, 3).map((geo) => (
              <div
                key={geo.region}
                className="flex justify-between items-center text-sm"
              >
                <span>{geo.region}</span>
                <span className="font-medium">{geo.vendor_count} vendors</span>
              </div>
            ))}
          </div>
        </div>
      </MetricCard>

      {/* Substitutability Coverage */}
      <MetricCard
        title="Substitutability"
        icon={Link2}
        iconColor={metrics.substitutability_coverage_percentage < 50 ? 'text-orange-500' : 'text-green-500'}
        tooltip={KPI_HELP.substitutability}
        action={{
          label: 'Start Assessment',
          onClick: () => {},
        }}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">
              {metrics.substitutability_coverage_percentage}%
            </span>
            {metrics.substitutability_coverage_percentage < 100 && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                Action Needed
              </Badge>
            )}
          </div>

          <Progress
            value={metrics.substitutability_coverage_percentage}
            className="h-2"
          />

          <div className="text-sm text-muted-foreground">
            {metrics.substitutability_assessed_count} of {metrics.total_vendors} vendors assessed
          </div>

          {metrics.not_substitutable_count > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                {metrics.not_substitutable_count} not substitutable
              </span>
            </div>
          )}
        </div>
      </MetricCard>

      {/* Fourth-Party Depth */}
      <MetricCard
        title="Fourth-Party Depth"
        icon={TrendingUp}
        iconColor="text-indigo-500"
        tooltip={KPI_HELP.fourthPartyDepth}
      >
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-3xl font-bold">{metrics.avg_chain_length.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground ml-1">avg hops</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold">{metrics.max_chain_depth}</span>
              <span className="text-sm text-muted-foreground ml-1">max depth</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Average vendor subcontractor chain length
          </p>

          {metrics.max_chain_depth > 3 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-400">
                Deep chains detected
              </span>
            </div>
          )}
        </div>
      </MetricCard>

      {/* Single Points of Failure */}
      <MetricCard
        title="Single Points of Failure"
        icon={AlertTriangle}
        iconColor={metrics.spof_count > 0 ? 'text-red-500' : 'text-green-500'}
        tooltip={KPI_HELP.spof}
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{metrics.spof_count}</span>
            {metrics.spof_count === 0 ? (
              <Badge className="bg-green-100 text-green-700">Healthy</Badge>
            ) : (
              <Badge variant="destructive">At Risk</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {metrics.spof_count === 0
              ? 'All critical functions have backup coverage'
              : `${metrics.spof_count} critical function${metrics.spof_count > 1 ? 's' : ''} with single provider`}
          </p>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span>Critical Functions</span>
              <span className="font-medium">{metrics.total_critical_functions}</span>
            </div>
          </div>
        </div>
      </MetricCard>
    </div>
  );
}
