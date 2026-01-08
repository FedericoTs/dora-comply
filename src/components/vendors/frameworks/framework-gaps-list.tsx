'use client';

/**
 * Framework Gaps List Component
 *
 * Displays compliance gaps with priority, remediation guidance,
 * and cross-framework impact indicators.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { FrameworkGap, RequirementPriority, FrameworkCode } from '@/lib/compliance/framework-types';

interface FrameworkGapsListProps {
  gaps: FrameworkGap[];
  maxVisible?: number;
  showCrossFrameworkImpact?: boolean;
}

const PRIORITY_STYLES: Record<RequirementPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' },
  low: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/30' },
};

const EFFORT_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: 'High Effort', color: 'text-red-600' },
  medium: { label: 'Medium Effort', color: 'text-amber-600' },
  low: { label: 'Low Effort', color: 'text-emerald-600' },
};

const FRAMEWORK_LABELS: Record<FrameworkCode, string> = {
  dora: 'DORA',
  nis2: 'NIS2',
  gdpr: 'GDPR',
  iso27001: 'ISO 27001',
};

export function FrameworkGapsList({
  gaps,
  maxVisible = 5,
  showCrossFrameworkImpact = true,
}: FrameworkGapsListProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  if (gaps.length === 0) {
    return null;
  }

  const visibleGaps = showAll ? gaps : gaps.slice(0, maxVisible);
  const hasMore = gaps.length > maxVisible;

  const toggleGap = (gapId: string) => {
    setExpandedGaps((prev) => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  };

  const criticalCount = gaps.filter((g) => g.priority === 'critical').length;
  const highCount = gaps.filter((g) => g.priority === 'high').length;

  return (
    <Card className={cn(criticalCount > 0 && 'border-red-500/30')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn('h-5 w-5', criticalCount > 0 ? 'text-red-500' : 'text-amber-500')}
            />
            <CardTitle className="text-lg">
              Compliance Gaps ({gaps.length})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                {highCount} High
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Identified gaps requiring attention, sorted by priority
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {visibleGaps.map((gap) => {
          const isExpanded = expandedGaps.has(gap.requirement_id);
          const priorityStyle = PRIORITY_STYLES[gap.priority];
          const effortInfo = EFFORT_LABELS[gap.estimated_effort] || EFFORT_LABELS.medium;

          // Filter cross-framework impacts that would be satisfied
          const crossFrameworkBenefits = gap.cross_framework_impact?.filter(
            (impact) => impact.would_satisfy
          );

          return (
            <Collapsible
              key={gap.requirement_id}
              open={isExpanded}
              onOpenChange={() => toggleGap(gap.requirement_id)}
            >
              <div
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  priorityStyle.border,
                  priorityStyle.bg,
                  'hover:shadow-sm'
                )}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-start justify-between gap-3 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-xs font-mono', priorityStyle.bg, priorityStyle.text)}
                        >
                          {gap.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm">{gap.requirement_title}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {gap.gap_description}
                      </p>

                      {/* Cross-framework badges */}
                      {showCrossFrameworkImpact && crossFrameworkBenefits && crossFrameworkBenefits.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-muted-foreground">Also satisfies:</span>
                          {crossFrameworkBenefits.map((impact) => (
                            <Badge
                              key={impact.framework}
                              variant="outline"
                              className="text-xs bg-emerald-500/10 text-emerald-600"
                            >
                              {FRAMEWORK_LABELS[impact.framework]}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={effortInfo.color}>{effortInfo.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3 pt-3 border-t border-dashed space-y-3">
                    {/* Remediation Suggestion */}
                    <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-primary">Remediation Guidance</p>
                        <p className="text-sm mt-1">{gap.remediation_suggestion}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Category:</span>
                      <Badge variant="secondary" className="text-xs">
                        {gap.category}
                      </Badge>
                    </div>

                    {/* Cross-framework impact details */}
                    {showCrossFrameworkImpact &&
                      gap.cross_framework_impact &&
                      gap.cross_framework_impact.length > 0 && (
                        <div className="p-2 rounded-md bg-background/50">
                          <p className="text-xs font-medium mb-2">Cross-Framework Impact</p>
                          <div className="space-y-1">
                            {gap.cross_framework_impact.map((impact) => (
                              <div
                                key={`${impact.framework}-${impact.requirement_id}`}
                                className="flex items-center gap-2 text-xs"
                              >
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  {FRAMEWORK_LABELS[impact.framework]}
                                </Badge>
                                <span className="text-muted-foreground truncate">
                                  {impact.requirement_id}
                                </span>
                                {impact.would_satisfy && (
                                  <Badge className="text-xs bg-emerald-500 text-white">
                                    Would Satisfy
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {/* Show More/Less Button */}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All ({gaps.length - maxVisible} more)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
