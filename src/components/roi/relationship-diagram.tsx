'use client';

/**
 * Relationship Diagram
 *
 * Visual diagram showing template dependencies and data flow
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateNodeComponent } from './template-node';
import { cn } from '@/lib/utils';
import {
  TEMPLATE_NODES,
  TEMPLATE_RELATIONSHIPS,
  GROUP_COLORS,
  calculateNodePositions,
  getPrerequisites,
  getDependents,
  type TemplateNode,
  type TemplateRelationship,
} from '@/lib/roi/template-relationships';
import type { RoiTemplateId } from '@/lib/roi/types';

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

export function RelationshipDiagram({
  templateStats = [],
  className,
}: RelationshipDiagramProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<RoiTemplateId | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Calculate node positions
  const positions = useMemo(() => calculateNodePositions(TEMPLATE_NODES), []);

  // Get stats map for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, TemplateStatsBase>();
    templateStats.forEach(stat => {
      map.set(stat.templateId, stat);
    });
    return map;
  }, [templateStats]);

  // Get highlighted nodes (connected to selected)
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<RoiTemplateId>();

    const highlighted = new Set<RoiTemplateId>();
    highlighted.add(selectedNode);

    // Add prerequisites and dependents
    getPrerequisites(selectedNode).forEach(id => highlighted.add(id));
    getDependents(selectedNode).forEach(id => highlighted.add(id));

    return highlighted;
  }, [selectedNode]);

  // Get relationships to highlight
  const highlightedRelationships = useMemo(() => {
    if (!selectedNode) return new Set<string>();

    const highlighted = new Set<string>();
    TEMPLATE_RELATIONSHIPS.forEach(rel => {
      if (rel.source === selectedNode || rel.target === selectedNode) {
        highlighted.add(`${rel.source}-${rel.target}`);
      }
    });

    return highlighted;
  }, [selectedNode]);

  const handleNodeClick = useCallback((nodeId: RoiTemplateId) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, []);

  const handleNavigate = useCallback((nodeId: RoiTemplateId) => {
    router.push(`/roi/templates/${nodeId}`);
  }, [router]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 700;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Template Relationships</CardTitle>
            <CardDescription>
              Understand data flow between RoI templates
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-2">
          {Object.entries(GROUP_COLORS).map(([group, color]) => (
            <Badge
              key={group}
              variant="outline"
              className="text-xs capitalize"
              style={{ borderColor: color, color }}
            >
              {group}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-muted/30"
          style={{ height: 500 }}
        >
          <div
            className="absolute inset-0 transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
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
                {/* Arrow marker */}
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#94a3b8"
                  />
                </marker>
                <marker
                  id="arrowhead-highlighted"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#3b82f6"
                  />
                </marker>
              </defs>

              {/* Connection lines */}
              {TEMPLATE_RELATIONSHIPS.map((rel) => {
                const sourcePos = positions.get(rel.source);
                const targetPos = positions.get(rel.target);
                if (!sourcePos || !targetPos) return null;

                const isHighlighted = highlightedRelationships.has(`${rel.source}-${rel.target}`);
                const isDimmed = selectedNode && !isHighlighted;

                // Calculate control points for curved lines
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;
                const offset = rel.type === 'requires' ? -30 : rel.type === 'feeds' ? 0 : 30;

                return (
                  <path
                    key={`${rel.source}-${rel.target}`}
                    d={`M ${sourcePos.x + 50} ${sourcePos.y}
                        Q ${midX} ${midY + offset}
                        ${targetPos.x - 50} ${targetPos.y}`}
                    fill="none"
                    stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={rel.type === 'references' ? '5,5' : 'none'}
                    opacity={isDimmed ? 0.2 : 1}
                    markerEnd={`url(#${isHighlighted ? 'arrowhead-highlighted' : 'arrowhead'})`}
                    className="transition-all duration-200"
                  />
                );
              })}
            </svg>

            {/* Template Nodes */}
            {TEMPLATE_NODES.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;

              const stats = statsMap.get(node.id);
              const isHighlighted = selectedNode ? highlightedNodes.has(node.id) : false;
              const isDimmed = selectedNode !== null && !highlightedNodes.has(node.id);

              return (
                <TemplateNodeComponent
                  key={node.id}
                  node={node}
                  completeness={stats?.completeness || 0}
                  errorCount={stats?.errorCount || 0}
                  isSelected={selectedNode === node.id}
                  isHighlighted={isHighlighted && selectedNode !== node.id}
                  isDimmed={isDimmed}
                  onClick={() => handleNodeClick(node.id)}
                  onNavigate={() => handleNavigate(node.id)}
                  color={GROUP_COLORS[node.group]}
                  style={{
                    left: pos.x,
                    top: pos.y,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="border-t p-4 bg-muted/50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">
                  {TEMPLATE_NODES.find(n => n.id === selectedNode)?.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPrerequisites(selectedNode).length > 0 && (
                    <span className="mr-3">
                      Prerequisites: {getPrerequisites(selectedNode).join(', ')}
                    </span>
                  )}
                  {getDependents(selectedNode).length > 0 && (
                    <span>
                      Feeds into: {getDependents(selectedNode).join(', ')}
                    </span>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleNavigate(selectedNode)}
              >
                Open Template
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simplified flow diagram
 */
export function SimpleFlowDiagram({ className }: { className?: string }) {
  const groups = ['entity', 'providers', 'contracts', 'links', 'functions', 'exit'] as const;

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      {groups.map((group, index) => (
        <div key={group} className="flex items-center">
          <div
            className="px-3 py-2 rounded-lg text-xs font-medium text-white capitalize"
            style={{ backgroundColor: GROUP_COLORS[group] }}
          >
            {group}
          </div>
          {index < groups.length - 1 && (
            <div className="w-4 h-0.5 bg-muted-foreground/30 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
