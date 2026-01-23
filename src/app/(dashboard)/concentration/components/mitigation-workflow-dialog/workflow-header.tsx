'use client';

import { Badge } from '@/components/ui/badge';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ConcentrationAlert } from '@/lib/concentration/types';
import type { RiskLevel } from '@/lib/constants/ui';
import { ALERT_CONFIG } from './constants';

interface WorkflowHeaderProps {
  alert: ConcentrationAlert;
}

export function WorkflowHeader({ alert }: WorkflowHeaderProps) {
  const config = ALERT_CONFIG[alert.severity as RiskLevel];
  const Icon = config.icon;

  return (
    <DialogHeader>
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', config.bgClass)}>
          <Icon className={cn('h-5 w-5', config.iconClass)} />
        </div>
        <div className="flex-1">
          <DialogTitle className={config.titleClass}>{alert.title}</DialogTitle>
          <DialogDescription className="mt-1 flex items-center gap-2">
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
            <span className="text-xs">{alert.type.replace(/_/g, ' ')}</span>
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}
