'use client';

import { AlertCircle, AlertTriangle, Bell, Info, X, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
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

// Recommended actions based on alert type
const ALERT_ACTIONS: Record<string, string[]> = {
  spof_detected: [
    'Identify alternative vendors for critical functions',
    'Develop exit strategy and transition plan',
    'Review contractual exit provisions',
    'Document recovery procedures',
    'Conduct substitutability assessment',
  ],
  geographic_concentration: [
    'Evaluate vendors in alternative regions',
    'Assess business continuity impact',
    'Review data residency requirements',
    'Consider multi-region deployment options',
  ],
  service_concentration: [
    'Diversify service providers',
    'Evaluate competitive alternatives',
    'Review service level agreements',
    'Assess vendor lock-in risks',
  ],
  threshold_breach: [
    'Review fourth-party oversight procedures',
    'Request subcontractor information from vendors',
    'Assess critical function exposure at depth',
    'Update monitoring for deep chains',
  ],
  substitutability_gap: [
    'Complete substitutability assessments for critical vendors',
    'Document alternative providers',
    'Estimate transition timelines and costs',
    'Update vendor exit strategies',
  ],
};

// Alert Details Dialog
function AlertDetailsDialog({
  alert,
  open,
  onOpenChange,
}: {
  alert: ConcentrationAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  if (!alert) return null;

  const config = ALERT_CONFIG[alert.severity];
  const Icon = config.icon;
  const actions = ALERT_ACTIONS[alert.type] || [];

  const handleViewVendor = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
    onOpenChange(false);
  };

  const handleCreateMitigation = () => {
    // Navigate based on alert type
    if (alert.type === 'spof_detected' && alert.affected_vendors.length > 0) {
      router.push(`/vendors/${alert.affected_vendors[0]}?tab=risk`);
    } else if (alert.type === 'substitutability_gap') {
      router.push('/vendors?filter=no-substitutability');
    } else {
      router.push('/vendors');
    }
    onOpenChange(false);
    toast.success('Navigate to vendors to create mitigation plan');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgClass)}>
              <Icon className={cn('h-5 w-5', config.iconClass)} />
            </div>
            <div>
              <DialogTitle className={config.titleClass}>{alert.title}</DialogTitle>
              <DialogDescription className="mt-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] uppercase mr-2',
                    alert.severity === 'critical' && 'bg-red-100 text-red-700',
                    alert.severity === 'high' && 'bg-orange-100 text-orange-700',
                    alert.severity === 'medium' && 'bg-yellow-100 text-yellow-700',
                    alert.severity === 'low' && 'bg-blue-100 text-blue-700'
                  )}
                >
                  {alert.severity}
                </Badge>
                {alert.type.replace(/_/g, ' ')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{alert.description}</p>
          </div>

          {/* Affected Functions */}
          {alert.affected_functions && alert.affected_functions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Affected Critical Functions</h4>
              <div className="flex flex-wrap gap-2">
                {alert.affected_functions.map((func) => (
                  <Badge key={func} variant="outline">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Affected Vendors */}
          {alert.affected_vendors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Affected Vendors ({alert.affected_vendors.length})
              </h4>
              <div className="space-y-1">
                {alert.affected_vendors.slice(0, 5).map((vendorId) => (
                  <Button
                    key={vendorId}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-8 text-xs"
                    onClick={() => handleViewVendor(vendorId)}
                  >
                    <span className="truncate">{vendorId}</span>
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                ))}
                {alert.affected_vendors.length > 5 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    +{alert.affected_vendors.length - 5} more vendors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
              <ul className="space-y-1">
                {actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button className="flex-1" onClick={handleCreateMitigation}>
              <FileText className="h-4 w-4 mr-2" />
              Create Mitigation Plan
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertBanner({
  alert,
  onDismiss,
  onViewDetails,
  onTakeAction,
}: {
  alert: ConcentrationAlert;
  onDismiss: (id: string) => void;
  onViewDetails: (alert: ConcentrationAlert) => void;
  onTakeAction: (alert: ConcentrationAlert) => void;
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
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onViewDetails(alert)}
            >
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
            {alert.action_required && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onTakeAction(alert)}
              >
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
  const router = useRouter();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<ConcentrationAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    toast.success('Alert dismissed for 7 days');
  };

  const handleViewDetails = (alert: ConcentrationAlert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleTakeAction = (alert: ConcentrationAlert) => {
    // Navigate based on alert type
    if (alert.type === 'spof_detected' && alert.affected_vendors.length > 0) {
      router.push(`/vendors/${alert.affected_vendors[0]}`);
    } else if (alert.type === 'substitutability_gap') {
      router.push('/vendors');
      toast.info('Review vendors without substitutability assessment');
    } else if (alert.type === 'geographic_concentration') {
      router.push('/vendors');
      toast.info('Review vendor geographic distribution');
    } else {
      router.push('/vendors');
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {visibleAlerts.map((alert, index) => (
          <div
            key={alert.id}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <AlertBanner
              alert={alert}
              onDismiss={handleDismiss}
              onViewDetails={handleViewDetails}
              onTakeAction={handleTakeAction}
            />
          </div>
        ))}
      </div>

      <AlertDetailsDialog
        alert={selectedAlert}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

// Single prominent alert banner for the top of the page
export function ConcentrationAlertBanner({
  alerts,
  className,
}: ConcentrationAlertsProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Show the most severe alert
  const topAlert = alerts[0];

  if (!topAlert || dismissed) {
    return null;
  }

  const config = ALERT_CONFIG[topAlert.severity];
  const Icon = config.icon;

  const handleViewDetails = () => {
    setDialogOpen(true);
  };

  const handleCreateMitigation = () => {
    // Navigate based on alert type
    if (topAlert.type === 'spof_detected' && topAlert.affected_vendors.length > 0) {
      router.push(`/vendors/${topAlert.affected_vendors[0]}`);
      toast.success('Opening vendor details for mitigation planning');
    } else if (topAlert.type === 'substitutability_gap') {
      router.push('/vendors');
      toast.info('Review vendors to complete substitutability assessments');
    } else if (topAlert.type === 'geographic_concentration') {
      router.push('/vendors');
      toast.info('Review vendor distribution to address geographic concentration');
    } else {
      router.push('/vendors');
      toast.info('Review vendors to create mitigation plan');
    }
  };

  return (
    <>
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
            <Button size="sm" variant="outline" onClick={handleViewDetails}>
              View Details
            </Button>
            <Button size="sm" onClick={handleCreateMitigation}>
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

      <AlertDetailsDialog
        alert={topAlert}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
