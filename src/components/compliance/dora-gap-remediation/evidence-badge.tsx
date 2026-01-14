'use client';

import { FileText, Link as LinkIcon, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DORAEvidence } from './types';

interface EvidenceBadgeProps {
  evidence: DORAEvidence;
}

export function EvidenceBadge({ evidence }: EvidenceBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={evidence.status === 'verified' ? 'default' : 'outline'}
          className={cn('text-xs gap-1', {
            'bg-success': evidence.status === 'verified',
            'border-warning text-warning': evidence.status === 'pending',
          })}
        >
          {evidence.evidence_type === 'document' && <FileText className="h-3 w-3" />}
          {evidence.evidence_type === 'link' && <LinkIcon className="h-3 w-3" />}
          {evidence.evidence_type === 'attestation' && <User className="h-3 w-3" />}
          {evidence.title}
          {evidence.status === 'pending' && <Clock className="h-3 w-3" />}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{evidence.description || evidence.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Status: {evidence.status}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SOC2CoverageBadgeProps {
  coverage: 'full' | 'partial';
}

export function SOC2CoverageBadge({ coverage }: SOC2CoverageBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="text-xs gap-1">
          <FileText className="h-3 w-3" />
          SOC 2 {coverage === 'full' ? 'Full' : 'Partial'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Evidence from parsed SOC 2 report
      </TooltipContent>
    </Tooltip>
  );
}
