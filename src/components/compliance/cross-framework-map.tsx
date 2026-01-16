'use client';

/**
 * Cross-Framework Map Component
 *
 * Visual representation of how controls map across different compliance frameworks.
 * Shows mapping relationships as a matrix or flow diagram.
 */

import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FrameworkCode,
  FRAMEWORK_NAMES,
  CrossFrameworkMapping,
} from '@/lib/compliance/framework-types';
import {
  getAllFrameworkOverlaps,
  getMappingsBetweenFrameworks,
  FrameworkOverlapSummary,
} from '@/lib/compliance/mappings';

// =============================================================================
// Types
// =============================================================================

interface CrossFrameworkMapProps {
  showDetailedMappings?: boolean;
  className?: string;
}

interface CrossFrameworkMatrixProps {
  overlaps: FrameworkOverlapSummary[];
  onCellClick?: (source: FrameworkCode, target: FrameworkCode) => void;
  selectedPair?: { source: FrameworkCode; target: FrameworkCode } | null;
  className?: string;
}

interface MappingFlowProps {
  source: FrameworkCode;
  target: FrameworkCode;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ALL_FRAMEWORKS: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];

const FRAMEWORK_ICONS: Record<FrameworkCode, typeof Shield> = {
  dora: Shield,
  nis2: Layers,
  gdpr: FileText,
  iso27001: Target,
};

const FRAMEWORK_COLORS: Record<FrameworkCode, string> = {
  dora: 'bg-blue-500',
  nis2: 'bg-purple-500',
  gdpr: 'bg-green-500',
  iso27001: 'bg-orange-500',
};

const MAPPING_TYPE_COLORS = {
  equivalent: 'bg-emerald-500',
  partial: 'bg-amber-500',
  supports: 'bg-blue-500',
  related: 'bg-gray-400',
};

const MAPPING_TYPE_LABELS = {
  equivalent: 'Equivalent',
  partial: 'Partial',
  supports: 'Supports',
  related: 'Related',
};

// =============================================================================
// Cross-Framework Matrix
// =============================================================================

export function CrossFrameworkMatrix({
  overlaps,
  onCellClick,
  selectedPair,
  className,
}: CrossFrameworkMatrixProps) {
  const getOverlap = (source: FrameworkCode, target: FrameworkCode) => {
    return overlaps.find((o) => o.source === source && o.target === target);
  };

  const getCellColor = (coverage: number) => {
    if (coverage >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (coverage >= 60) return 'bg-green-100 dark:bg-green-900/30';
    if (coverage >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (coverage >= 20) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-gray-100 dark:bg-gray-900/30';
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr>
            <th className="p-2 border bg-muted text-left text-sm font-medium">
              Source → Target
            </th>
            {ALL_FRAMEWORKS.map((fw) => {
              const Icon = FRAMEWORK_ICONS[fw];
              return (
                <th key={fw} className="p-2 border bg-muted text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className={cn('p-1 rounded', FRAMEWORK_COLORS[fw])}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium">{fw.toUpperCase()}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ALL_FRAMEWORKS.map((sourceFw) => {
            const SourceIcon = FRAMEWORK_ICONS[sourceFw];
            return (
              <tr key={sourceFw}>
                <td className="p-2 border bg-muted">
                  <div className="flex items-center gap-1">
                    <div className={cn('p-1 rounded', FRAMEWORK_COLORS[sourceFw])}>
                      <SourceIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium">{sourceFw.toUpperCase()}</span>
                  </div>
                </td>
                {ALL_FRAMEWORKS.map((targetFw) => {
                  if (sourceFw === targetFw) {
                    return (
                      <td
                        key={targetFw}
                        className="p-2 border text-center bg-muted/50"
                      >
                        <span className="text-muted-foreground">—</span>
                      </td>
                    );
                  }

                  const overlap = getOverlap(sourceFw, targetFw);
                  const isSelected =
                    selectedPair?.source === sourceFw &&
                    selectedPair?.target === targetFw;

                  if (!overlap || overlap.total_mappings === 0) {
                    return (
                      <td
                        key={targetFw}
                        className="p-2 border text-center bg-gray-50 dark:bg-gray-900/20"
                      >
                        <span className="text-xs text-muted-foreground">—</span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={targetFw}
                      className={cn(
                        'p-2 border text-center cursor-pointer transition-all',
                        getCellColor(overlap.average_coverage),
                        isSelected && 'ring-2 ring-primary ring-inset'
                      )}
                      onClick={() => onCellClick?.(sourceFw, targetFw)}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1">
                              <div className="font-semibold text-sm">
                                {overlap.total_mappings}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {overlap.average_coverage}%
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <div>
                                {FRAMEWORK_NAMES[sourceFw]} → {FRAMEWORK_NAMES[targetFw]}
                              </div>
                              <div>{overlap.total_mappings} mappings</div>
                              <div>{overlap.equivalent_count} equivalent</div>
                              <div>{overlap.partial_count} partial</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Mapping Flow Diagram
// =============================================================================

export function MappingFlow({ source, target, className }: MappingFlowProps) {
  const [expanded, setExpanded] = useState(false);
  const mappings = useMemo(
    () => getMappingsBetweenFrameworks(source, target),
    [source, target]
  );

  const SourceIcon = FRAMEWORK_ICONS[source];
  const TargetIcon = FRAMEWORK_ICONS[target];

  // Group mappings by type
  const groupedMappings = useMemo(() => {
    return mappings.reduce(
      (acc, m) => {
        acc[m.mapping_type].push(m);
        return acc;
      },
      {
        equivalent: [] as CrossFrameworkMapping[],
        partial: [] as CrossFrameworkMapping[],
        supports: [] as CrossFrameworkMapping[],
        related: [] as CrossFrameworkMapping[],
      }
    );
  }, [mappings]);

  if (mappings.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No mappings between {FRAMEWORK_NAMES[source]} and {FRAMEWORK_NAMES[target]}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', FRAMEWORK_COLORS[source])}>
              <SourceIcon className="h-4 w-4 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={cn('p-2 rounded-lg', FRAMEWORK_COLORS[target])}>
              <TargetIcon className="h-4 w-4 text-white" />
            </div>
          </div>
          <Badge variant="outline">{mappings.length} mappings</Badge>
        </div>
        <CardTitle className="text-base">
          {FRAMEWORK_NAMES[source]} → {FRAMEWORK_NAMES[target]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary bars */}
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(groupedMappings) as Array<keyof typeof groupedMappings>).map(
            (type) => {
              const count = groupedMappings[type].length;
              const percentage = (count / mappings.length) * 100;

              return (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', MAPPING_TYPE_COLORS[type])}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {count} {MAPPING_TYPE_LABELS[type]} mappings ({Math.round(percentage)}%)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
          )}
        </div>

        {/* Expandable mapping list */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mappings.slice(0, 10).map((mapping) => (
              <div
                key={`${mapping.source_requirement_id}-${mapping.target_requirement_id}`}
                className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30"
              >
                <Badge
                  className={cn('text-xs shrink-0', MAPPING_TYPE_COLORS[mapping.mapping_type])}
                >
                  {mapping.coverage_percentage}%
                </Badge>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-medium truncate">
                    {mapping.source_requirement_id}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    {mapping.target_requirement_id}
                  </div>
                  {mapping.notes && (
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {mapping.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {mappings.length > 10 && (
              <p className="text-xs text-center text-muted-foreground">
                +{mappings.length - 10} more mappings
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Cross-Framework Map Component
// =============================================================================

export function CrossFrameworkMap({
  showDetailedMappings = true,
  className,
}: CrossFrameworkMapProps) {
  const [selectedPair, setSelectedPair] = useState<{
    source: FrameworkCode;
    target: FrameworkCode;
  } | null>(null);

  const overlaps = useMemo(() => getAllFrameworkOverlaps(), []);

  const handleCellClick = (source: FrameworkCode, target: FrameworkCode) => {
    if (selectedPair?.source === source && selectedPair?.target === target) {
      setSelectedPair(null);
    } else {
      setSelectedPair({ source, target });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Matrix View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Cross-Framework Coverage Matrix
          </CardTitle>
          <CardDescription>
            Click any cell to see detailed mappings between frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CrossFrameworkMatrix
            overlaps={overlaps}
            onCellClick={handleCellClick}
            selectedPair={selectedPair}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Equivalent</div>
                <p className="text-xs text-muted-foreground">
                  Near-identical requirements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Partial</div>
                <p className="text-xs text-muted-foreground">
                  Some coverage overlap
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Supports</div>
                <p className="text-xs text-muted-foreground">
                  Helps meet requirement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Related</div>
                <p className="text-xs text-muted-foreground">
                  Conceptually connected
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Pair Detail */}
      {showDetailedMappings && selectedPair && (
        <MappingFlow source={selectedPair.source} target={selectedPair.target} />
      )}
    </div>
  );
}

// =============================================================================
// Compact Cross-Framework Summary (for dashboards)
// =============================================================================

interface CrossFrameworkSummaryProps {
  sourceFramework: FrameworkCode;
  className?: string;
}

export function CrossFrameworkSummary({
  sourceFramework,
  className,
}: CrossFrameworkSummaryProps) {
  const overlaps = useMemo(() => getAllFrameworkOverlaps(), []);
  const relevantOverlaps = overlaps.filter((o) => o.source === sourceFramework);

  const SourceIcon = FRAMEWORK_ICONS[sourceFramework];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className={cn('p-1.5 rounded', FRAMEWORK_COLORS[sourceFramework])}>
            <SourceIcon className="h-4 w-4 text-white" />
          </div>
          {FRAMEWORK_NAMES[sourceFramework]} Coverage
        </CardTitle>
        <CardDescription>
          Cross-framework mapping from {FRAMEWORK_NAMES[sourceFramework]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {relevantOverlaps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No cross-framework mappings available
          </p>
        ) : (
          relevantOverlaps.map((overlap) => {
            const TargetIcon = FRAMEWORK_ICONS[overlap.target as FrameworkCode];
            return (
              <div
                key={overlap.target}
                className="flex items-center gap-3"
              >
                <div className={cn('p-1 rounded', FRAMEWORK_COLORS[overlap.target as FrameworkCode])}>
                  <TargetIcon className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">
                      {FRAMEWORK_NAMES[overlap.target as FrameworkCode]}
                    </span>
                    <span className="text-muted-foreground">
                      {overlap.average_coverage}%
                    </span>
                  </div>
                  <Progress value={overlap.average_coverage} className="h-1.5" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
