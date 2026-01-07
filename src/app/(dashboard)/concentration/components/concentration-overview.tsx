'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RiskLevelSummary, RiskLevel } from '@/lib/concentration/types';
import { RISK_COLORS } from '@/lib/concentration/types';

interface ConcentrationOverviewProps {
  riskLevels: RiskLevelSummary[];
  className?: string;
}

const RISK_CONFIG: Record<RiskLevel, {
  icon: React.ElementType;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    bgClass: 'bg-red-500/10 dark:bg-red-500/20',
    borderClass: 'border-red-500/30 hover:border-red-500/50',
    textClass: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
    borderClass: 'border-orange-500/30 hover:border-orange-500/50',
    textClass: 'text-orange-600 dark:text-orange-400',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  medium: {
    icon: Info,
    label: 'Medium',
    bgClass: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    borderClass: 'border-yellow-500/30 hover:border-yellow-500/50',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  low: {
    icon: CheckCircle2,
    label: 'Low',
    bgClass: 'bg-green-500/10 dark:bg-green-500/20',
    borderClass: 'border-green-500/30 hover:border-green-500/50',
    textClass: 'text-green-600 dark:text-green-400',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

function RiskCard({ summary }: { summary: RiskLevelSummary }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = RISK_CONFIG[summary.level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-all duration-200 cursor-pointer',
        config.bgClass,
        config.borderClass,
        isExpanded && 'ring-1 ring-current/20'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn('p-2 rounded-lg', config.bgClass)}
            style={{ backgroundColor: `${RISK_COLORS[summary.level]}15` }}
          >
            <Icon className={cn('h-5 w-5', config.textClass)} />
          </div>
          <Badge variant="secondary" className={cn('font-medium uppercase text-xs', config.badgeClass)}>
            {config.label}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </div>

      {/* Stats */}
      <div className="space-y-1 mb-3">
        <div className="flex items-baseline gap-2">
          <span className={cn('text-3xl font-bold tracking-tight', config.textClass)}>
            {summary.vendor_count}
          </span>
          <span className="text-sm text-muted-foreground">
            vendor{summary.vendor_count !== 1 ? 's' : ''}
          </span>
        </div>
        {summary.critical_function_count > 0 && (
          <p className="text-sm text-muted-foreground">
            Affecting {summary.critical_function_count} critical function{summary.critical_function_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Concern */}
      <p className="text-sm font-medium text-foreground/80 line-clamp-2">
        {summary.primary_concern}
      </p>

      {/* Expanded Details */}
      {isExpanded && summary.vendors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/10 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Affected Vendors
          </p>
          <ul className="space-y-1.5">
            {summary.vendors.slice(0, 5).map((vendor) => (
              <li key={vendor.id} className="flex items-center gap-2 text-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: RISK_COLORS[summary.level] }}
                />
                <span className="font-medium">{vendor.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {vendor.tier}
                </Badge>
              </li>
            ))}
            {summary.vendors.length > 5 && (
              <li className="text-xs text-muted-foreground pl-3.5">
                +{summary.vendors.length - 5} more vendors
              </li>
            )}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className={cn('mt-3 w-full', config.textClass)}
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to filtered vendors view
            }}
          >
            View All
          </Button>
        </div>
      )}
    </div>
  );
}

export function ConcentrationOverview({ riskLevels, className }: ConcentrationOverviewProps) {
  // Ensure we have all risk levels represented
  const orderedLevels: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
  const riskMap = new Map(riskLevels.map((r) => [r.level, r]));

  const displayLevels = orderedLevels.map((level) =>
    riskMap.get(level) || {
      level,
      vendor_count: 0,
      critical_function_count: 0,
      primary_concern: level === 'low' ? 'No issues detected' : 'No issues at this level',
      vendors: [],
    }
  );

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {displayLevels.map((summary, index) => (
        <div
          key={summary.level}
          className="animate-in fade-in-0 slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
        >
          <RiskCard summary={summary} />
        </div>
      ))}
    </div>
  );
}
