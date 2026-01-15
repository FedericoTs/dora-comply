'use client';

/**
 * DORA Gap Remediation Component
 *
 * Shows all 45 DORA requirements with their coverage status and allows
 * users to upload evidence or attest to requirements not covered by SOC 2.
 *
 * Features:
 * - Full list of DORA requirements grouped by pillar
 * - Coverage status (SOC 2 covered, manually evidenced, gap)
 * - Evidence upload and attestation forms
 * - Progress tracking toward 100% compliance
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DORAPillar } from '@/lib/compliance/dora-types';
import type { DORAGapRemediationProps, RequirementWithEvidence } from './types';
import { useDORAGapRemediation } from './use-dora-gap-remediation';
import { ProgressOverviewCard } from './progress-overview-card';
import { PillarSection } from './pillar-section';

export function DORAGapRemediation({
  vendorId,
  soc2CoverageByRequirement,
  className,
}: DORAGapRemediationProps) {
  const {
    expandedPillars,
    requirementsByPillar,
    stats,
    togglePillar,
    addEvidence,
  } = useDORAGapRemediation({
    vendorId,
    soc2CoverageByRequirement,
  });

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        <ProgressOverviewCard stats={stats} />

        {/* Requirements by Pillar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Requirements by Pillar</CardTitle>
            <CardDescription>
              Click to expand and add evidence for gaps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(requirementsByPillar) as [DORAPillar, RequirementWithEvidence[]][]).map(
              ([pillar, requirements]) => (
                <PillarSection
                  key={pillar}
                  pillar={pillar}
                  requirements={requirements}
                  isExpanded={expandedPillars.has(pillar)}
                  onToggle={() => togglePillar(pillar)}
                  vendorId={vendorId}
                  onEvidenceAdded={addEvidence}
                />
              )
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
