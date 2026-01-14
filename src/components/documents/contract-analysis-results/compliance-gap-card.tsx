'use client';

import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import type { ComplianceGap } from './types';

interface ComplianceGapCardProps {
  gap: ComplianceGap;
}

const PRIORITY_COLORS = {
  low: 'border-muted',
  medium: 'border-warning/50',
  high: 'border-destructive/50',
} as const;

export function ComplianceGapCard({ gap }: ComplianceGapCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${PRIORITY_COLORS[gap.priority]}`}>
      <div className="flex items-start gap-3">
        <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{gap.provision}</span>
            <Badge variant="outline" className="text-xs">
              {gap.article}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs capitalize ${
                gap.priority === 'high'
                  ? 'border-destructive text-destructive'
                  : gap.priority === 'medium'
                  ? 'border-warning text-warning'
                  : ''
              }`}
            >
              {gap.priority} priority
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{gap.description}</p>
          <p className="text-sm mt-2">
            <span className="font-medium">Remediation:</span> {gap.remediation}
          </p>
        </div>
      </div>
    </div>
  );
}
