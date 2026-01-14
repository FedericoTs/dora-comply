'use client';

import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { RequirementWithEvidence, DORAEvidence } from './types';
import { getStatusIcon, getStatusBadge } from './status-utils';
import { EvidenceBadge, SOC2CoverageBadge } from './evidence-badge';
import { AddEvidenceForm } from './add-evidence-form';

interface RequirementRowProps {
  requirement: RequirementWithEvidence;
  vendorId: string;
  onEvidenceAdded: (evidence: DORAEvidence) => void;
}

export function RequirementRow({
  requirement,
  vendorId,
  onEvidenceAdded,
}: RequirementRowProps) {
  return (
    <div
      className={cn(
        'p-4 hover:bg-muted/30 transition-colors',
        requirement.overallStatus === 'gap' && 'bg-destructive/5'
      )}
    >
      <div className="flex items-start gap-3">
        {getStatusIcon(requirement.overallStatus)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {requirement.article_number}
            </Badge>
            <span className="font-medium">{requirement.article_title}</span>
            {getStatusBadge(requirement.overallStatus)}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {requirement.requirement_text}
          </p>

          {/* Evidence indicators */}
          <div className="flex flex-wrap items-center gap-2">
            {requirement.soc2Coverage !== 'none' && (
              <SOC2CoverageBadge coverage={requirement.soc2Coverage} />
            )}
            {requirement.manualEvidence.map((ev) => (
              <EvidenceBadge key={ev.id} evidence={ev} />
            ))}
          </div>

          {/* Evidence needed hint */}
          {requirement.overallStatus !== 'covered' && requirement.evidence_needed && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Evidence needed: </span>
              {requirement.evidence_needed.slice(0, 3).join(', ')}
              {requirement.evidence_needed.length > 3 && '...'}
            </div>
          )}
        </div>

        {/* Add Evidence Button */}
        {requirement.overallStatus !== 'covered' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant={requirement.overallStatus === 'gap' ? 'default' : 'outline'}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <AddEvidenceForm
                requirement={requirement}
                vendorId={vendorId}
                onSuccess={onEvidenceAdded}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
