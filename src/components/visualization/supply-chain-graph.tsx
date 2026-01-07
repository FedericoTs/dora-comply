'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DependencyGraph, DependencyNode, DependencyEdge } from '@/lib/concentration/types';

interface SupplyChainGraphProps {
  data: DependencyGraph;
  width?: number;
  height?: number;
  onNodeClick?: (node: DependencyNode) => void;
  className?: string;
}

// Extended node type for D3 simulation
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: DependencyNode['type'];
  tier: DependencyNode['tier'];
  risk_score: number | null;
  services: string[];
  radius: number;
}

// Extended edge type for D3 simulation
interface SimulationEdge extends d3.SimulationLinkDatum<SimulationNode> {
  service: string;
  criticality: string;
}

// Color scheme for node types and tiers
const NODE_COLORS = {
  entity: {
    fill: 'hsl(var(--primary))',
    stroke: 'hsl(var(--primary))',
  },
  third_party: {
    critical: { fill: '#ef4444', stroke: '#dc2626' },
    important: { fill: '#f97316', stroke: '#ea580c' },
    standard: { fill: '#22c55e', stroke: '#16a34a' },
  },
  fourth_party: {
    critical: { fill: '#fca5a5', stroke: '#ef4444' },
    important: { fill: '#fed7aa', stroke: '#f97316' },
    standard: { fill: '#86efac', stroke: '#22c55e' },
  },
};

export function SupplyChainGraph({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  className,
}: SupplyChainGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Prepare simulation data
  const prepareData = useCallback(() => {
    const nodes: SimulationNode[] = data.nodes.map((node) => ({
      ...node,
      radius: node.type === 'entity' ? 32 : node.type === 'third_party' ? 24 : 18,
    }));

    const edges: SimulationEdge[] = data.edges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));

    return { nodes, edges };
  }, [data]);

  // Get node color based on type and tier
  const getNodeColor = (node: SimulationNode) => {
    if (node.type === 'entity') {
      return NODE_COLORS.entity;
    }
    const tierColors = NODE_COLORS[node.type];
    return tierColors[node.tier as keyof typeof tierColors] || tierColors.standard;
  };

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, edges } = prepareData();

    // Create container group for zoom
    const g = svg.append('g').attr('class', 'graph-container');

    // Define arrow markers
    svg
      .append('defs')
      .selectAll('marker')
      .data(['arrow-critical', 'arrow-standard'])
      .join('marker')
      .attr('id', (d) => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', (d) => (d === 'arrow-critical' ? '#ef4444' : '#94a3b8'))
      .attr('d', 'M0,-5L10,0L0,5');

    // Create force simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationEdge>(edges)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force(
        'collision',
        d3.forceCollide<SimulationNode>().radius((d) => d.radius + 10)
      )
      .force('x', d3.forceX(dimensions.width / 2).strength(0.05))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.05));

    // Create edges
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d) => (d.criticality === 'critical' ? '#ef4444' : '#94a3b8'))
      .attr('stroke-width', (d) => (d.criticality === 'critical' ? 2 : 1.5))
      .attr('stroke-dasharray', (d) => {
        const source = d.source as SimulationNode;
        const target = d.target as SimulationNode;
        return target.type === 'fourth_party' ? '4,2' : 'none';
      })
      .attr('marker-end', (d) =>
        d.criticality === 'critical' ? 'url(#arrow-critical)' : 'url(#arrow-standard)'
      );

    // Create node groups
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    // Apply drag behavior separately with proper typing
    const dragBehavior = d3
      .drag<SVGGElement, SimulationNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior);

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => getNodeColor(d).fill)
      .attr('stroke', (d) => getNodeColor(d).stroke)
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .on('mouseenter', function () {
        d3.select(this).transition().duration(150).attr('stroke-width', 4);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(150).attr('stroke-width', 2);
      });

    // Add labels to nodes
    node
      .append('text')
      .text((d) => (d.name.length > 12 ? `${d.name.slice(0, 10)}...` : d.name))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 14)
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('pointer-events', 'none');

    // Add tier badges for third/fourth parties
    node
      .filter((d) => d.type !== 'entity')
      .append('text')
      .text((d) => (d.type === 'fourth_party' ? '4th' : '3rd'))
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // Add icon for entity node
    node
      .filter((d) => d.type === 'entity')
      .append('text')
      .text('You')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimulationNode).x!)
        .attr('y1', (d) => (d.source as SimulationNode).y!)
        .attr('x2', (d) => (d.target as SimulationNode).x!)
        .attr('y2', (d) => (d.target as SimulationNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, dimensions, prepareData, onNodeClick]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 400),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy,
      factor
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform,
      d3.zoomIdentity
    );
  };

  if (data.nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-96 bg-muted/20 rounded-xl border border-dashed', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No Supply Chain Data</p>
          <p className="text-sm mt-1">Add subcontractors to vendors to visualize the supply chain</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative rounded-xl border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={() => handleZoom(1.5)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={() => handleZoom(0.67)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handleReset}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
        <div className="font-medium mb-1.5">Legend</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.entity.fill }} />
            <span>Your Org</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }} />
            <span>Important</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-muted-foreground" style={{ strokeDasharray: '4,2' }} />
            <span>4th Party</span>
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{selectedNode.name}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                {selectedNode.type.replace('_', ' ')} • {selectedNode.tier}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          {selectedNode.services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedNode.services.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="px-1.5 py-0.5 bg-muted rounded text-[10px]"
                >
                  {service}
                </span>
              ))}
              {selectedNode.services.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{selectedNode.services.length - 3} more
                </span>
              )}
            </div>
          )}
          {selectedNode.risk_score !== null && (
            <div className="mt-2 text-xs">
              Risk Score: <span className="font-medium">{selectedNode.risk_score}</span>
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
