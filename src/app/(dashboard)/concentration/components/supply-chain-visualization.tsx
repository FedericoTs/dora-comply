'use client';

import { useState } from 'react';
import {
  Network,
  Filter,
  Download,
  Maximize2,
  Building2,
  Link2,
  AlertTriangle,
  Shield,
  ExternalLink,
  Layers,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplyChainGraph } from '@/components/visualization/supply-chain-graph';
import { cn } from '@/lib/utils';
import type { DependencyGraph, DependencyNode } from '@/lib/concentration/types';
import type { AggregateChainMetrics } from '@/lib/concentration/chain-utils';

interface SupplyChainVisualizationProps {
  graph: DependencyGraph;
  metrics: AggregateChainMetrics;
}

export function SupplyChainVisualization({
  graph,
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
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'rounded-lg p-2.5',
                selectedNode?.type === 'entity' && 'bg-primary/10',
                selectedNode?.type === 'third_party' && 'bg-orange-500/10 dark:bg-orange-500/20',
                selectedNode?.type === 'fourth_party' && 'bg-blue-500/10 dark:bg-blue-500/20'
              )}>
                {selectedNode?.type === 'entity' ? (
                  <Building2 className="h-5 w-5 text-primary" />
                ) : selectedNode?.type === 'fourth_party' ? (
                  <Link2 className="h-5 w-5 text-blue-500" />
                ) : (
                  <Shield className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg">{selectedNode?.name}</SheetTitle>
                <SheetDescription className="mt-1">
                  {selectedNode?.type === 'entity'
                    ? 'Your organization'
                    : selectedNode?.type === 'fourth_party'
                    ? 'Fourth-party subcontractor'
                    : 'Third-party vendor'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {selectedNode && (
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
              <div className="space-y-4">
                {/* Classification Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge
                        variant={selectedNode.type === 'fourth_party' ? 'secondary' : 'default'}
                        className={cn(
                          selectedNode.type === 'entity' && 'bg-primary',
                          selectedNode.type === 'third_party' && 'bg-orange-500 hover:bg-orange-500/90',
                          selectedNode.type === 'fourth_party' && 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300'
                        )}
                      >
                        {selectedNode.type === 'entity'
                          ? 'Your Organization'
                          : selectedNode.type === 'fourth_party'
                          ? '4th Party'
                          : '3rd Party'}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tier</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          selectedNode.tier === 'critical' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400',
                          selectedNode.tier === 'important' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                          selectedNode.tier === 'standard' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400'
                        )}
                      >
                        {selectedNode.tier === 'critical' && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        <span className="capitalize">{selectedNode.tier}</span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Score Card */}
                {selectedNode.risk_score !== null && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <span className={cn(
                          'text-2xl font-bold',
                          selectedNode.risk_score >= 70 && 'text-red-600',
                          selectedNode.risk_score >= 40 && selectedNode.risk_score < 70 && 'text-orange-500',
                          selectedNode.risk_score < 40 && 'text-green-600'
                        )}>
                          {selectedNode.risk_score}
                        </span>
                      </div>
                      <Progress
                        value={selectedNode.risk_score}
                        className={cn(
                          'h-2',
                          selectedNode.risk_score >= 70 && '[&>div]:bg-red-500',
                          selectedNode.risk_score >= 40 && selectedNode.risk_score < 70 && '[&>div]:bg-orange-500',
                          selectedNode.risk_score < 40 && '[&>div]:bg-green-500'
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {selectedNode.risk_score >= 70
                          ? 'High risk - requires immediate attention'
                          : selectedNode.risk_score >= 40
                          ? 'Moderate risk - monitor closely'
                          : 'Low risk - within acceptable thresholds'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Services Card */}
                {selectedNode.services.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        Services Provided
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.services.map((service) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className="font-normal"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fourth Party Info */}
                {selectedNode.type === 'fourth_party' && (
                  <Card className="border-blue-100 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Link2 className="h-4 w-4" />
                        Fourth-Party Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-700/80 dark:text-blue-300/80">
                      <p>
                        This is a subcontractor of one of your third-party vendors.
                        Per DORA Article 28(8), you should maintain visibility of
                        all subcontractors supporting critical or important functions.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                {selectedNode.type !== 'entity' && (
                  <div className="pt-2 space-y-2">
                    <Button className="w-full" asChild>
                      <a href={`/vendors/${selectedNode.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Profile
                      </a>
                    </Button>
                    {selectedNode.type === 'fourth_party' && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`/vendors?subcontractor=${selectedNode.id}`}>
                          View Parent Vendor
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
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
