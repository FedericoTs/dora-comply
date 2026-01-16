'use client';

import { useState, useMemo } from 'react';
import { Target, MapPin, Info, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NIS2Risk, HeatMapConfig, HeatMapCell, LikelihoodScore, ImpactScore } from '@/lib/nis2/types';
import {
  generateHeatMapData,
  getCellBackgroundColor,
  getCellBorderColor,
  getCellHoverColor,
  calculatePositionMarkers,
  calculateRiskDistribution,
  LIKELIHOOD_LABELS,
  IMPACT_LABELS,
} from '@/lib/nis2/heat-map-utils';
import { NIS2_CATEGORIES, NIS2CategoryLabels, type NIS2Category } from '@/lib/compliance/nis2-types';
import { RiskLevelBadge } from '../shared/risk-level-badge';

interface RiskHeatMapProps {
  risks: NIS2Risk[];
  toleranceThreshold?: number;
  showLegend?: boolean;
  showPositionMarkers?: boolean;
  className?: string;
  onCellClick?: (cell: HeatMapCell) => void;
}

export function RiskHeatMap({
  risks,
  toleranceThreshold = 9,
  showLegend = true,
  showPositionMarkers = true,
  className,
  onCellClick,
}: RiskHeatMapProps) {
  const [view, setView] = useState<'inherent' | 'residual'>('residual');
  const [filterCategory, setFilterCategory] = useState<NIS2Category | undefined>();
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);

  // Generate heat map config
  const config: HeatMapConfig = useMemo(() => ({
    view,
    tolerance_threshold: toleranceThreshold,
    show_aggregate_position: showPositionMarkers,
    show_target_position: showPositionMarkers,
    filter_category: filterCategory,
  }), [view, toleranceThreshold, showPositionMarkers, filterCategory]);

  // Filter risks by category if needed
  const filteredRisks = useMemo(() => {
    return filterCategory
      ? risks.filter(r => r.category === filterCategory)
      : risks;
  }, [risks, filterCategory]);

  // Generate heat map data
  const heatMapData = useMemo(() => {
    return generateHeatMapData(filteredRisks, config);
  }, [filteredRisks, config]);

  // Calculate position markers
  const { current } = useMemo(() => {
    return calculatePositionMarkers(filteredRisks, view, toleranceThreshold);
  }, [filteredRisks, view, toleranceThreshold]);

  // Calculate risk distribution
  const distribution = useMemo(() => {
    return calculateRiskDistribution(filteredRisks, view);
  }, [filteredRisks, view]);

  const handleCellClick = (cell: HeatMapCell) => {
    setSelectedCell(cell);
    onCellClick?.(cell);
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>Risk Heat Map</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The heat map visualizes risks by likelihood (horizontal) and impact (vertical). Colors indicate risk severity.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Select value={view} onValueChange={(v) => setView(v as 'inherent' | 'residual')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residual">Residual Risk</SelectItem>
                  <SelectItem value="inherent">Inherent Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterCategory ?? 'all'}
                onValueChange={(v) => setFilterCategory(v === 'all' ? undefined : v as NIS2Category)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {NIS2_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {NIS2CategoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Heat map grid */}
            <div className="flex-1">
              <div className="relative">
                {/* Y-axis label */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-sm font-medium text-muted-foreground">
                  Impact →
                </div>

                {/* Grid container */}
                <div className="ml-6">
                  {/* Y-axis labels */}
                  <div className="flex">
                    <div className="w-16 flex flex-col justify-around py-1 pr-2">
                      {([5, 4, 3, 2, 1] as ImpactScore[]).map((impact) => (
                        <div key={impact} className="h-16 flex items-center justify-end">
                          <span className="text-xs text-muted-foreground">
                            {IMPACT_LABELS[impact]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-5 gap-1">
                        {heatMapData.flatMap((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <HeatMapCellComponent
                              key={`${rowIndex}-${colIndex}`}
                              cell={cell}
                              isSelected={selectedCell?.likelihood === cell.likelihood && selectedCell?.impact === cell.impact}
                              isCurrent={
                                showPositionMarkers &&
                                current !== null &&
                                Math.round(current.likelihood) === cell.likelihood &&
                                Math.round(current.impact) === cell.impact
                              }
                              isTarget={
                                showPositionMarkers &&
                                cell.score === toleranceThreshold
                              }
                              onClick={() => handleCellClick(cell)}
                            />
                          ))
                        )}
                      </div>

                      {/* X-axis labels */}
                      <div className="flex mt-2">
                        {([1, 2, 3, 4, 5] as LikelihoodScore[]).map((likelihood) => (
                          <div key={likelihood} className="flex-1 text-center">
                            <span className="text-xs text-muted-foreground">
                              {LIKELIHOOD_LABELS[likelihood]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* X-axis label */}
                      <div className="text-center mt-2 text-sm font-medium text-muted-foreground">
                        Likelihood →
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              {showLegend && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
                      <span className="text-muted-foreground">Low (1-4)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200" />
                      <span className="text-muted-foreground">Medium (5-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
                      <span className="text-muted-foreground">High (10-15)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                      <span className="text-muted-foreground">Critical (16-25)</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Current position</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-emerald-600" />
                      <span className="text-muted-foreground">Target</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Side panel - distribution or selected cell */}
            <div className="lg:w-64 space-y-4">
              {/* Distribution */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium text-sm mb-3">Distribution</h4>
                <div className="space-y-2">
                  <DistributionRow
                    label="Critical"
                    count={distribution.by_level.critical}
                    total={distribution.total}
                    colorClass="bg-red-500"
                  />
                  <DistributionRow
                    label="High"
                    count={distribution.by_level.high}
                    total={distribution.total}
                    colorClass="bg-orange-500"
                  />
                  <DistributionRow
                    label="Medium"
                    count={distribution.by_level.medium}
                    total={distribution.total}
                    colorClass="bg-amber-500"
                  />
                  <DistributionRow
                    label="Low"
                    count={distribution.by_level.low}
                    total={distribution.total}
                    colorClass="bg-emerald-500"
                  />
                </div>
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{distribution.total}</span> risks
                </div>
              </div>

              {/* Current position */}
              {showPositionMarkers && current && (
                <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">You are here</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Score:</span>
                      <span className="font-medium">{current.score.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Level:</span>
                      <RiskLevelBadge level={current.level} size="sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Selected cell */}
              {selectedCell && selectedCell.risk_count > 0 && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">
                      L{selectedCell.likelihood} × I{selectedCell.impact}
                    </h4>
                    <Badge variant="secondary">
                      {selectedCell.risk_count} {selectedCell.risk_count === 1 ? 'risk' : 'risks'}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCell.risks.map((risk) => (
                      <a
                        key={risk.id}
                        href={`/nis2/risk-register/${risk.id}`}
                        className="block p-2 rounded hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {risk.reference_code}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{risk.title}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Heat map cell component
interface HeatMapCellComponentProps {
  cell: HeatMapCell;
  isSelected?: boolean;
  isCurrent?: boolean;
  isTarget?: boolean;
  onClick?: () => void;
}

function HeatMapCellComponent({
  cell,
  isSelected,
  isCurrent,
  isTarget,
  onClick,
}: HeatMapCellComponentProps) {
  const hasRisks = cell.risk_count > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'relative h-16 rounded border transition-all duration-150',
            getCellBackgroundColor(cell.level, hasRisks),
            getCellBorderColor(cell.level),
            getCellHoverColor(cell.level),
            isSelected && 'ring-2 ring-primary ring-offset-1',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
          )}
        >
          {/* Risk count */}
          {hasRisks && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-1 text-sm font-medium">
                <Users className="h-3 w-3" />
                {cell.risk_count}
              </span>
            </span>
          )}

          {/* Current position marker */}
          {isCurrent && (
            <span className="absolute -top-1 -right-1">
              <MapPin className="h-4 w-4 text-primary fill-primary/20" />
            </span>
          )}

          {/* Target position marker */}
          {isTarget && (
            <span className="absolute -bottom-1 -left-1">
              <Target className="h-4 w-4 text-emerald-600" />
            </span>
          )}

          {/* Tolerance line indicator */}
          {cell.is_above_tolerance && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-center">
          <p className="font-medium">
            Score: {cell.score} ({cell.level})
          </p>
          <p className="text-xs text-muted-foreground">
            {LIKELIHOOD_LABELS[cell.likelihood]} × {IMPACT_LABELS[cell.impact]}
          </p>
          {hasRisks && (
            <p className="text-xs mt-1">
              {cell.risk_count} {cell.risk_count === 1 ? 'risk' : 'risks'} in this cell
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Distribution row component
interface DistributionRowProps {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}

function DistributionRow({ label, count, total, colorClass }: DistributionRowProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{count}</span>
    </div>
  );
}
