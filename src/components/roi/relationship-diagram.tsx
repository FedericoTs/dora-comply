'use client';

/**
 * Relationship Diagram
 *
 * Visual diagram showing template dependencies and data flow
 * Enhanced with better navigation and clear data flow visualization
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_NODES,
  TEMPLATE_RELATIONSHIPS,
  GROUP_COLORS,
  getPrerequisites,
  getDependents,
  getCompletionOrder,
  type TemplateNode,
} from '@/lib/roi/template-relationships';
import { getTemplateUrl, type RoiTemplateId } from '@/lib/roi/types';

// Minimal interface for template stats - works with both RoiStats and RoiTemplateStatus
interface TemplateStatsBase {
  templateId: RoiTemplateId;
  completeness: number;
  errorCount?: number;
}

interface RelationshipDiagramProps {
  templateStats?: TemplateStatsBase[];
  className?: string;
}

// Enhanced layout calculation with group-based positioning
function calculateEnhancedPositions(nodes: TemplateNode[]): Map<RoiTemplateId, { x: number; y: number }> {
  const positions = new Map<RoiTemplateId, { x: number; y: number }>();

  // Group-based horizontal positioning
  const groupOrder: TemplateNode['group'][] = ['entity', 'providers', 'contracts', 'links', 'functions', 'exit'];
  const groupX: Record<string, number> = {};
  const groupWidth = 140;
  const startX = 70;

  groupOrder.forEach((group, index) => {
    groupX[group] = startX + index * groupWidth;
  });

  // Position nodes within groups
  const groupCounts: Record<string, number> = {};
  const groupCurrentY: Record<string, number> = {};

  // Initialize counters
  groupOrder.forEach((group) => {
    groupCounts[group] = nodes.filter((n) => n.group === group).length;
    groupCurrentY[group] = 0;
  });

  // Calculate vertical spacing per group
  const totalHeight = 450;
  const topPadding = 60;

  nodes.forEach((node) => {
    const count = groupCounts[node.group];
    const spacing = (totalHeight - topPadding) / (count + 1);
    groupCurrentY[node.group]++;

    positions.set(node.id, {
      x: groupX[node.group],
      y: topPadding + spacing * groupCurrentY[node.group],
    });
  });

  return positions;
}

export function RelationshipDiagram({
  templateStats = [],
  className,
}: RelationshipDiagramProps) {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<RoiTemplateId | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<RoiTemplateId | null>(null);

  // Calculate enhanced positions
  const positions = useMemo(() => calculateEnhancedPositions(TEMPLATE_NODES), []);

  // Get stats map for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, TemplateStatsBase>();
    templateStats.forEach((stat) => {
      map.set(stat.templateId, stat);
    });
    return map;
  }, [templateStats]);

  // Get highlighted nodes (connected to selected or hovered)
  const activeNode = selectedNode || hoveredNode;
  const highlightedNodes = useMemo(() => {
    if (!activeNode) return new Set<RoiTemplateId>();

    const highlighted = new Set<RoiTemplateId>();
    highlighted.add(activeNode);
    getPrerequisites(activeNode).forEach((id) => highlighted.add(id));
    getDependents(activeNode).forEach((id) => highlighted.add(id));

    return highlighted;
  }, [activeNode]);

  // Get relationships to highlight
  const highlightedRelationships = useMemo(() => {
    if (!activeNode) return new Set<string>();

    const highlighted = new Set<string>();
    TEMPLATE_RELATIONSHIPS.forEach((rel) => {
      if (rel.source === activeNode || rel.target === activeNode) {
        highlighted.add(`${rel.source}-${rel.target}`);
      }
    });

    return highlighted;
  }, [activeNode]);

  const handleNodeClick = useCallback((nodeId: RoiTemplateId) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleNavigate = useCallback(
    (nodeId: RoiTemplateId) => {
      router.push(getTemplateUrl(nodeId));
    },
    [router]
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.6));
  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
  };

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 500;

  // Calculate overall completion
  const overallCompletion = useMemo(() => {
    if (templateStats.length === 0) return 0;
    return Math.round(
      templateStats.reduce((sum, s) => sum + s.completeness, 0) / templateStats.length
    );
  }, [templateStats]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Template Relationships</CardTitle>
            <CardDescription>Click templates to see dependencies</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {overallCompletion}% complete
            </Badge>
            <div className="flex items-center gap-0.5 border rounded-md">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {Object.entries(GROUP_COLORS).map(([group, color]) => (
            <Badge
              key={group}
              variant="outline"
              className="text-[10px] capitalize px-1.5 py-0"
              style={{ borderColor: color, color }}
            >
              {group}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className="relative overflow-hidden bg-muted/20"
          style={{ height: 420 }}
        >
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* SVG for connection lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
                <marker
                  id="arrow-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Connection lines */}
              {TEMPLATE_RELATIONSHIPS.map((rel) => {
                const sourcePos = positions.get(rel.source);
                const targetPos = positions.get(rel.target);
                if (!sourcePos || !targetPos) return null;

                const isHighlighted = highlightedRelationships.has(
                  `${rel.source}-${rel.target}`
                );
                const isDimmed = activeNode && !isHighlighted;

                // Calculate curved path
                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;
                const curveOffset = rel.type === 'requires' ? -15 : rel.type === 'feeds' ? 0 : 15;

                return (
                  <path
                    key={`${rel.source}-${rel.target}`}
                    d={`M ${sourcePos.x + 50} ${sourcePos.y}
                        Q ${sourcePos.x + dx / 2} ${sourcePos.y + dy / 2 + curveOffset}
                        ${targetPos.x - 10} ${targetPos.y}`}
                    fill="none"
                    stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={rel.type === 'references' ? '4,3' : 'none'}
                    opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.5}
                    markerEnd={`url(#${isHighlighted ? 'arrow-active' : 'arrow'})`}
                    className="transition-all duration-150"
                  />
                );
              })}
            </svg>

            {/* Template Nodes */}
            <TooltipProvider>
              {TEMPLATE_NODES.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const stats = statsMap.get(node.id);
                const completeness = stats?.completeness || 0;
                const errorCount = stats?.errorCount || 0;
                const isSelected = selectedNode === node.id;
                const isHighlighted = activeNode ? highlightedNodes.has(node.id) : false;
                const isDimmed = activeNode !== null && !highlightedNodes.has(node.id);
                const isComplete = completeness === 100;
                const hasErrors = errorCount > 0;

                return (
                  <Tooltip key={node.id}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          'absolute w-[100px] transition-all duration-150',
                          'rounded-lg border-2 bg-background p-2 text-left shadow-sm',
                          'hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50',
                          isSelected && 'ring-2 ring-primary shadow-lg scale-105',
                          isHighlighted && !isSelected && 'ring-1 ring-primary/50',
                          isDimmed && 'opacity-30'
                        )}
                        style={{
                          left: pos.x - 50,
                          top: pos.y - 30,
                          borderColor: GROUP_COLORS[node.group],
                        }}
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onDoubleClick={() => handleNavigate(node.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[10px] font-mono opacity-70"
                            style={{ color: GROUP_COLORS[node.group] }}
                          >
                            {node.id.replace('.', '_')}
                          </span>
                          {isComplete && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                          {hasErrors && !isComplete && (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <p className="text-[11px] font-medium leading-tight line-clamp-2">
                          {node.shortName}
                        </p>
                        <Progress
                          value={completeness}
                          className={cn(
                            'h-1 mt-1.5',
                            isComplete && '[&>div]:bg-green-500',
                            hasErrors && !isComplete && '[&>div]:bg-amber-500'
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-medium">{node.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {completeness}% complete
                        {errorCount > 0 && ` • ${errorCount} errors`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Double-click to open
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>

        {/* Selected Node Info Panel */}
        {selectedNode && (
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">
                    {TEMPLATE_NODES.find((n) => n.id === selectedNode)?.name}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor:
                        GROUP_COLORS[
                          TEMPLATE_NODES.find((n) => n.id === selectedNode)?.group || 'entity'
                        ],
                    }}
                  >
                    {selectedNode}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {getPrerequisites(selectedNode).length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600">Requires:</span>
                      <span>{getPrerequisites(selectedNode).join(', ')}</span>
                    </div>
                  )}
                  {getDependents(selectedNode).length > 0 && (
                    <div className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-blue-600">Feeds:</span>
                      <span>{getDependents(selectedNode).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button size="sm" onClick={() => handleNavigate(selectedNode)}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open
              </Button>
            </div>
          </div>
        )}

        {/* Help text when no selection */}
        {!selectedNode && (
          <div className="border-t p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Info className="h-3 w-3" />
              Click a template to see dependencies • Double-click to open
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simplified flow diagram showing recommended completion order
 */
export function SimpleFlowDiagram({ className }: { className?: string }) {
  const completionOrder = useMemo(() => getCompletionOrder().slice(0, 6), []);

  return (
    <div className={cn('flex items-center justify-between gap-1', className)}>
      {completionOrder.map((templateId, index) => {
        const node = TEMPLATE_NODES.find((n) => n.id === templateId);
        if (!node) return null;

        return (
          <div key={templateId} className="flex items-center">
            <Link
              href={getTemplateUrl(templateId)}
              className={cn(
                'px-2 py-1.5 rounded text-[10px] font-medium text-white',
                'hover:opacity-90 transition-opacity'
              )}
              style={{ backgroundColor: GROUP_COLORS[node.group] }}
            >
              {node.shortName}
            </Link>
            {index < completionOrder.length - 1 && (
              <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}
