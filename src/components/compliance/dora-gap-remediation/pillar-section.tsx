'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { DORAPillar } from '@/lib/compliance/dora-types';
import { DORAPillarLabels } from '@/lib/compliance/dora-types';
import type { RequirementWithEvidence, DORAEvidence } from './types';
import { PillarIcons } from './pillar-icons';
import { RequirementRow } from './requirement-row';

interface PillarSectionProps {
  pillar: DORAPillar;
  requirements: RequirementWithEvidence[];
  isExpanded: boolean;
  onToggle: () => void;
  vendorId: string;
  onEvidenceAdded: (evidence: DORAEvidence) => void;
}

export function PillarSection({
  pillar,
  requirements,
  isExpanded,
  onToggle,
  vendorId,
  onEvidenceAdded,
}: PillarSectionProps) {
  const pillarCovered = requirements.filter((r) => r.overallStatus === 'covered').length;
  const pillarTotal = requirements.length;
  const pillarPercentage = Math.round((pillarCovered / pillarTotal) * 100);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
            isExpanded && 'rounded-b-none'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              pillarPercentage === 100
                ? 'bg-success/20 text-success'
                : pillarPercentage >= 50
                ? 'bg-warning/20 text-warning'
                : 'bg-destructive/20 text-destructive'
            )}
          >
            {PillarIcons[pillar]}
          </div>
          <div className="flex-1">
            <div className="font-medium">{DORAPillarLabels[pillar]}</div>
            <div className="text-sm text-muted-foreground">
              {pillarCovered} of {pillarTotal} requirements covered
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold">{pillarPercentage}%</div>
              <Progress value={pillarPercentage} className="h-1.5 w-20" />
            </div>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-x border-b rounded-b-lg divide-y">
          {requirements.map((req) => (
            <RequirementRow
              key={req.id}
              requirement={req}
              vendorId={vendorId}
              onEvidenceAdded={onEvidenceAdded}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
