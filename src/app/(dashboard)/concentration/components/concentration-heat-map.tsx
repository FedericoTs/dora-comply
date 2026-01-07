'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { HeatMapCell, HeatMapResponse, RiskLevel } from '@/lib/concentration/types';
import { RISK_COLORS, SERVICE_TYPE_LABELS, REGION_LABELS } from '@/lib/concentration/types';

interface ConcentrationHeatMapProps {
  data: HeatMapResponse;
  className?: string;
}

function getColorForScore(score: number): string {
  if (score >= 80) return RISK_COLORS.critical;
  if (score >= 60) return RISK_COLORS.high;
  if (score >= 40) return RISK_COLORS.medium;
  if (score > 0) return RISK_COLORS.low;
  return 'transparent';
}

function getOpacityForScore(score: number): number {
  if (score === 0) return 0;
  return Math.max(0.3, Math.min(1, score / 100));
}

interface CellDetailProps {
  cell: HeatMapCell | null;
  onClose: () => void;
}

function CellDetail({ cell, onClose }: CellDetailProps) {
  if (!cell) return null;

  const serviceName = SERVICE_TYPE_LABELS[cell.service_type] || cell.service_type;
  const regionName = REGION_LABELS[cell.region] || cell.region;

  return (
    <Sheet open={!!cell} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getColorForScore(cell.concentration_score) }}
            />
            {serviceName}
          </SheetTitle>
          <SheetDescription>
            {regionName} &middot; Concentration Score: {cell.concentration_score}%
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{cell.vendor_count}</p>
              <p className="text-xs text-muted-foreground">Vendors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{cell.critical_vendor_count}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{cell.critical_function_coverage}</p>
              <p className="text-xs text-muted-foreground">Functions</p>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Risk Level:</span>
            <Badge
              variant="secondary"
              className={cn(
                'uppercase',
                cell.risk_level === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                cell.risk_level === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                cell.risk_level === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                cell.risk_level === 'low' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              )}
            >
              {cell.risk_level}
            </Badge>
          </div>

          {/* Vendor List */}
          <div>
            <h4 className="text-sm font-medium mb-3">Vendors in this segment</h4>
            <ul className="space-y-2">
              {cell.vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        vendor.tier === 'critical' ? 'bg-red-500' :
                        vendor.tier === 'important' ? 'bg-orange-500' : 'bg-gray-400'
                      )}
                    />
                    <span className="text-sm font-medium">{vendor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendor.supports_critical_function && (
                      <Badge variant="outline" className="text-[10px]">
                        Critical Function
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {vendor.tier}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ConcentrationHeatMap({ data, className }: ConcentrationHeatMapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ service: string; region: string } | null>(null);

  // Create a lookup map for cells
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatMapCell>();
    for (const cell of data.cells) {
      map.set(`${cell.service_type}-${cell.region}`, cell);
    }
    return map;
  }, [data.cells]);

  const services = data.dimensions.services;
  const regions = data.dimensions.regions;

  if (services.length === 0 || regions.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-8 text-center', className)}>
        <p className="text-muted-foreground">
          No vendor data available for heat map visualization.
          <br />
          Add vendors with service types and locations to see concentration patterns.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Service × Geography Concentration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cell color indicates concentration risk level. Click a cell for details.
          </p>
        </div>

        {/* Heat Map Grid */}
        <div className="p-4 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Region Headers */}
            <div className="flex mb-2">
              <div className="w-40 shrink-0" /> {/* Service label column */}
              {regions.map((region) => (
                <div
                  key={region}
                  className="flex-1 px-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {REGION_LABELS[region] || region}
                </div>
              ))}
            </div>

            {/* Service Rows */}
            {services.map((service) => (
              <div key={service} className="flex items-center mb-1">
                {/* Service Label */}
                <div className="w-40 shrink-0 pr-3 text-sm font-medium truncate">
                  {SERVICE_TYPE_LABELS[service] || service}
                </div>

                {/* Region Cells */}
                {regions.map((region) => {
                  const cell = cellMap.get(`${service}-${region}`);
                  const score = cell?.concentration_score || 0;
                  const isHovered =
                    hoveredCell?.service === service && hoveredCell?.region === region;

                  return (
                    <div key={region} className="flex-1 px-0.5">
                      <button
                        className={cn(
                          'w-full h-12 rounded-md transition-all duration-150',
                          'border border-transparent',
                          'hover:border-foreground/20 hover:scale-105',
                          isHovered && 'ring-2 ring-primary/50',
                          !cell && 'bg-muted/30'
                        )}
                        style={{
                          backgroundColor: cell
                            ? `${getColorForScore(score)}${Math.round(getOpacityForScore(score) * 255).toString(16).padStart(2, '0')}`
                            : undefined,
                        }}
                        onMouseEnter={() => setHoveredCell({ service, region })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => cell && setSelectedCell(cell)}
                        title={
                          cell
                            ? `${cell.vendor_count} vendors (${cell.concentration_score}% concentration)`
                            : 'No vendors'
                        }
                      >
                        {cell && cell.vendor_count > 0 && (
                          <span className="text-xs font-bold text-white drop-shadow-sm">
                            {cell.vendor_count}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Concentration Risk:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: RISK_COLORS.low, opacity: 0.7 }}
                />
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: RISK_COLORS.medium, opacity: 0.8 }}
                />
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: RISK_COLORS.high, opacity: 0.9 }}
                />
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: RISK_COLORS.critical }}
                />
                <span className="text-xs">Critical</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Numbers indicate vendor count in each segment
          </p>
        </div>
      </div>

      <CellDetail cell={selectedCell} onClose={() => setSelectedCell(null)} />
    </>
  );
}
