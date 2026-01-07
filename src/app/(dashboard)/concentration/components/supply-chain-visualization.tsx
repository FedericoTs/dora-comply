'use client';

import { useState } from 'react';
import { Network, Filter, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SupplyChainGraph } from '@/components/visualization/supply-chain-graph';
import type { DependencyGraph, DependencyNode } from '@/lib/concentration/types';
import type { AggregateChainMetrics } from '@/lib/concentration/chain-utils';

interface SupplyChainVisualizationProps {
  graph: DependencyGraph;
  metrics: AggregateChainMetrics;
}

export function SupplyChainVisualization({
  graph,
  metrics,
}: SupplyChainVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter graph data
  const filteredGraph = {
    nodes: graph.nodes.filter((node) => {
      if (filterTier !== 'all' && node.tier !== filterTier) return false;
      if (filterType !== 'all' && node.type !== filterType) return false;
      return true;
    }),
    edges: graph.edges.filter((edge) => {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      const targetNode = graph.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return false;
      if (filterTier !== 'all') {
        if (sourceNode.tier !== filterTier && targetNode.tier !== filterTier) return false;
      }
      if (filterType !== 'all') {
        if (sourceNode.type !== filterType && targetNode.type !== filterType) return false;
      }
      return true;
    }),
  };

  const handleNodeClick = (node: DependencyNode) => {
    setSelectedNode(node);
  };

  const handleExport = () => {
    // Export graph as SVG
    const svg = document.querySelector('.graph-container')?.parentElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supply-chain-graph.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Supply Chain Graph</CardTitle>
                <CardDescription>
                  {graph.nodes.length} entities • {graph.edges.length} relationships
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="third_party">Third Parties</SelectItem>
                  <SelectItem value="fourth_party">Fourth Parties</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SupplyChainGraph
            data={filteredGraph}
            height={500}
            onNodeClick={handleNodeClick}
            className="rounded-none border-t"
          />
        </CardContent>
      </Card>

      {/* Node Detail Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedNode?.name}</SheetTitle>
          </SheetHeader>
          {selectedNode && (
            <div className="mt-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd className="mt-1 text-sm capitalize">
                  {selectedNode.type.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tier</dt>
                <dd className="mt-1 text-sm capitalize">{selectedNode.tier}</dd>
              </div>
              {selectedNode.risk_score !== null && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Risk Score</dt>
                  <dd className="mt-1 text-sm">{selectedNode.risk_score}</dd>
                </div>
              )}
              {selectedNode.services.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Services</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.services.map((service) => (
                        <span
                          key={service}
                          className="px-2 py-0.5 bg-muted rounded text-xs"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
              {selectedNode.type !== 'entity' && (
                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/vendors/${selectedNode.id}`}>View Vendor Details</a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Fullscreen Modal */}
      <Sheet open={isFullscreen} onOpenChange={setIsFullscreen}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Supply Chain Graph
            </SheetTitle>
          </SheetHeader>
          <SupplyChainGraph
            data={filteredGraph}
            height={window.innerHeight * 0.75}
            onNodeClick={handleNodeClick}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
