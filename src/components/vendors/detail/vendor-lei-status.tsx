'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LEIRegistrationStatus, EntityStatus } from '@/lib/vendors/types';

interface VendorLEIStatusProps {
  lei?: string | null;
  leiStatus?: LEIRegistrationStatus | null;
  leiVerifiedAt?: string | null;
  leiNextRenewal?: string | null;
  entityStatus?: EntityStatus | null;
}

const STATUS_CONFIG: Record<LEIRegistrationStatus, {
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
}> = {
  ISSUED: {
    label: 'Verified',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
    description: 'LEI is valid and current',
  },
  LAPSED: {
    label: 'Lapsed',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: AlertTriangle,
    description: 'LEI has lapsed and needs renewal',
  },
  RETIRED: {
    label: 'Retired',
    color: 'bg-error/10 text-error border-error/20',
    icon: XCircle,
    description: 'LEI has been retired',
  },
  ANNULLED: {
    label: 'Annulled',
    color: 'bg-error/10 text-error border-error/20',
    icon: XCircle,
    description: 'LEI has been annulled',
  },
  PENDING_VALIDATION: {
    label: 'Pending',
    color: 'bg-info/10 text-info border-info/20',
    icon: Clock,
    description: 'LEI is pending validation',
  },
  PENDING_TRANSFER: {
    label: 'Transferring',
    color: 'bg-info/10 text-info border-info/20',
    icon: Clock,
    description: 'LEI is being transferred',
  },
  PENDING_ARCHIVAL: {
    label: 'Archiving',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Clock,
    description: 'LEI is pending archival',
  },
};

export function VendorLEIStatus({
  lei,
  leiStatus,
  leiVerifiedAt,
  leiNextRenewal,
  entityStatus,
}: VendorLEIStatusProps) {
  // Hook must be called unconditionally (before any returns)
  // Calculate renewal check - this runs on every render but is lightweight
  const isRenewalSoon = useMemo(() => {
    if (!leiNextRenewal) return false;
    // Using a stable reference point (midnight today) to avoid Date.now() impurity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromToday = today.getTime() + 30 * 24 * 60 * 60 * 1000;
    return new Date(leiNextRenewal).getTime() < thirtyDaysFromToday;
  }, [leiNextRenewal]);

  if (!lei) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <HelpCircle className="h-3 w-3" />
              No LEI
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>No Legal Entity Identifier assigned</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const config = leiStatus ? STATUS_CONFIG[leiStatus] : null;
  const Icon = config?.icon || HelpCircle;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn('gap-1', config?.color || 'text-muted-foreground')}
            >
              <Icon className="h-3 w-3" />
              {config?.label || 'Unknown'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{config?.description || 'Status unknown'}</p>
              {leiVerifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Last verified: {new Date(leiVerifiedAt).toLocaleDateString()}
                </p>
              )}
              {leiNextRenewal && (
                <p className={cn('text-xs', isRenewalSoon ? 'text-warning' : 'text-muted-foreground')}>
                  Renewal: {new Date(leiNextRenewal).toLocaleDateString()}
                  {isRenewalSoon && ' (Soon!)'}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {entityStatus && (
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            entityStatus === 'ACTIVE'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {entityStatus}
        </Badge>
      )}

      {isRenewalSoon && (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Renewal Soon
        </Badge>
      )}
    </div>
  );
}
