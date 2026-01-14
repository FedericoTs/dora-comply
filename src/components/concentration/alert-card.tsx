'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConcentrationAlert } from './types';

interface AlertCardProps {
  alert: ConcentrationAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn('p-4 rounded-lg border', {
        'bg-red-500/10 border-red-500/30': alert.severity === 'critical',
        'bg-amber-500/10 border-amber-500/30': alert.severity === 'warning',
      })}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn('p-2 rounded-lg', {
            'bg-red-500/20 text-red-600': alert.severity === 'critical',
            'bg-amber-500/20 text-amber-600': alert.severity === 'warning',
          })}
        >
          {alert.severity === 'critical' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{alert.title}</span>
            <Badge
              variant="outline"
              className={cn('text-xs', {
                'border-red-500 text-red-600': alert.severity === 'critical',
                'border-amber-500 text-amber-600': alert.severity === 'warning',
              })}
            >
              {alert.percentage.toFixed(0)}% (threshold: {alert.threshold}%)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
          {alert.affectedItems.length > 3 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-1"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : `Show all ${alert.affectedItems.length} items`}
            </Button>
          )}
          {expanded && (
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.affectedItems.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
