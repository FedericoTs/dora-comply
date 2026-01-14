'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { RiskFlag } from './types';

interface RiskFlagCardProps {
  flag: RiskFlag;
}

const SEVERITY_COLORS = {
  low: 'border-muted bg-muted/50',
  medium: 'border-warning/50 bg-warning/10',
  high: 'border-orange-500/50 bg-orange-500/10',
  critical: 'border-destructive/50 bg-destructive/10',
} as const;

const SEVERITY_ICON_COLORS = {
  critical: 'text-destructive',
  high: 'text-orange-500',
  medium: 'text-warning',
  low: 'text-muted-foreground',
} as const;

export function RiskFlagCard({ flag }: RiskFlagCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${SEVERITY_COLORS[flag.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 ${SEVERITY_ICON_COLORS[flag.severity]}`}
          />
          <div>
            <p className="font-medium">{flag.category}</p>
            <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
            <p className="text-sm mt-2">
              <span className="font-medium">Recommendation:</span> {flag.recommendation}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {flag.severity}
        </Badge>
      </div>
    </div>
  );
}
