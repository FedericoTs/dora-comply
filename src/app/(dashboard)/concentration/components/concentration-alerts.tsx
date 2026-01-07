'use client';

import { AlertCircle, AlertTriangle, Bell, Info, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConcentrationAlert, RiskLevel } from '@/lib/concentration/types';

interface ConcentrationAlertsProps {
  alerts: ConcentrationAlert[];
  className?: string;
}

const ALERT_CONFIG: Record<RiskLevel, {
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/5 dark:bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-500',
    titleClass: 'text-red-700 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-500/5 dark:bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    iconClass: 'text-orange-500',
    titleClass: 'text-orange-700 dark:text-orange-400',
  },
  medium: {
    icon: Info,
    bgClass: 'bg-yellow-500/5 dark:bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    iconClass: 'text-yellow-600 dark:text-yellow-500',
    titleClass: 'text-yellow-700 dark:text-yellow-400',
  },
  low: {
    icon: Bell,
    bgClass: 'bg-blue-500/5 dark:bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    iconClass: 'text-blue-500',
    titleClass: 'text-blue-700 dark:text-blue-400',
  },
};

function AlertBanner({
  alert,
  onDismiss,
}: {
  alert: ConcentrationAlert;
  onDismiss: (id: string) => void;
}) {
  const config = ALERT_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        config.bgClass,
        config.borderClass,
        'animate-in fade-in-0 slide-in-from-top-2'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className={cn('h-5 w-5', config.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn('font-semibold', config.titleClass)}>
              {alert.title}
            </h4>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] uppercase',
                alert.severity === 'critical' && 'bg-red-100 text-red-700',
                alert.severity === 'high' && 'bg-orange-100 text-orange-700',
                alert.severity === 'medium' && 'bg-yellow-100 text-yellow-700',
                alert.severity === 'low' && 'bg-blue-100 text-blue-700'
              )}
            >
              {alert.severity}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {alert.description}
          </p>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
            {alert.action_required && (
              <Button size="sm" className="h-7 text-xs">
                Take Action
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground ml-auto"
              onClick={() => onDismiss(alert.id)}
            >
              Dismiss for 7 days
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onDismiss(alert.id)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}

export function ConcentrationAlerts({ alerts, className }: ConcentrationAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    // TODO: Persist dismissal to database
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <AlertBanner alert={alert} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>
  );
}

// Single prominent alert banner for the top of the page
export function ConcentrationAlertBanner({
  alerts,
  className,
}: ConcentrationAlertsProps) {
  const [dismissed, setDismissed] = useState(false);

  // Show the most severe alert
  const topAlert = alerts[0];

  if (!topAlert || dismissed) {
    return null;
  }

  const config = ALERT_CONFIG[topAlert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-all duration-200',
        config.bgClass,
        config.borderClass,
        'animate-in fade-in-0 slide-in-from-top-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', config.bgClass)}>
          <Icon className={cn('h-6 w-6', config.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Concentration Alert
            </span>
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] uppercase',
                topAlert.severity === 'critical' && 'bg-red-100 text-red-700',
                topAlert.severity === 'high' && 'bg-orange-100 text-orange-700'
              )}
            >
              {topAlert.severity}
            </Badge>
            {alerts.length > 1 && (
              <Badge variant="outline" className="text-[10px]">
                +{alerts.length - 1} more
              </Badge>
            )}
          </div>
          <p className={cn('font-semibold', config.titleClass)}>
            {topAlert.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {topAlert.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline">
            View Details
          </Button>
          <Button size="sm">
            Create Mitigation Plan
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
