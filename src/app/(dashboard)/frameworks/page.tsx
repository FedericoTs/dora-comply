'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layers,
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Target,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  FRAMEWORK_NAMES,
  FRAMEWORK_DESCRIPTIONS,
  ALL_FRAMEWORK_CATEGORIES,
  FrameworkCode,
  getComplianceStatusColor,
} from '@/lib/compliance/framework-types';
import { NIS2_REQUIREMENTS, NIS2_REQUIREMENT_COUNT } from '@/lib/compliance/nis2-requirements';
import { GDPR_REQUIREMENTS, GDPR_REQUIREMENT_COUNT } from '@/lib/compliance/gdpr-requirements';
import { ISO27001_REQUIREMENTS, ISO27001_REQUIREMENT_COUNT } from '@/lib/compliance/iso27001-requirements';
import { DORA_REQUIREMENT_COUNT } from '@/lib/compliance/dora-requirements-data';
import { getAllFrameworkOverlaps } from '@/lib/compliance/mappings';

// Framework icons
const FRAMEWORK_ICONS: Record<FrameworkCode, typeof Shield> = {
  dora: Shield,
  nis2: Layers,
  gdpr: FileText,
  iso27001: Target,
};

// Framework colors
const FRAMEWORK_COLORS: Record<FrameworkCode, string> = {
  dora: 'bg-blue-500',
  nis2: 'bg-purple-500',
  gdpr: 'bg-green-500',
  iso27001: 'bg-orange-500',
};

// Framework requirement counts
const REQUIREMENT_COUNTS: Record<FrameworkCode, number> = {
  dora: DORA_REQUIREMENT_COUNT, // 45 requirements from dora-requirements-data.ts
  nis2: NIS2_REQUIREMENT_COUNT,
  gdpr: GDPR_REQUIREMENT_COUNT,
  iso27001: ISO27001_REQUIREMENT_COUNT,
};

export default function FrameworksPage() {
  const [activeFramework, setActiveFramework] = useState<FrameworkCode>('dora');
  const [overlaps, setOverlaps] = useState<ReturnType<typeof getAllFrameworkOverlaps>>([]);

  useEffect(() => {
    setOverlaps(getAllFrameworkOverlaps());
  }, []);

  // Calculate statistics
  const totalRequirements = Object.values(REQUIREMENT_COUNTS).reduce((a, b) => a + b, 0);
  const totalMappings = overlaps.reduce((sum, o) => sum + o.total_mappings, 0);

  // Get categories for active framework
  const categories = ALL_FRAMEWORK_CATEGORIES[activeFramework] || [];

  // Get requirements for active framework
  const getRequirementsForFramework = (fw: FrameworkCode) => {
    switch (fw) {
      case 'nis2': return NIS2_REQUIREMENTS;
      case 'gdpr': return GDPR_REQUIREMENTS;
      case 'iso27001': return ISO27001_REQUIREMENTS;
      default: return [];
    }
  };

  const activeRequirements = getRequirementsForFramework(activeFramework);

  // Group requirements by category
  const requirementsByCategory = categories.reduce((acc, cat) => {
    acc[cat.code] = activeRequirements.filter(r => r.category === cat.code);
    return acc;
  }, {} as Record<string, typeof activeRequirements>);

  // Get relevant overlaps for active framework
  const relevantOverlaps = overlaps.filter(
    o => o.source === activeFramework || o.target === activeFramework
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Frameworks</h1>
          <p className="text-muted-foreground mt-1">
            Multi-framework compliance tracking and cross-framework analysis
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {totalRequirements} Requirements | {totalMappings} Cross-Mappings
        </Badge>
      </div>

      {/* Framework Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(FRAMEWORK_NAMES) as FrameworkCode[]).map((fw) => {
          const Icon = FRAMEWORK_ICONS[fw];
          const isActive = activeFramework === fw;
          const reqCount = REQUIREMENT_COUNTS[fw];

          return (
            <Card
              key={fw}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveFramework(fw)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${FRAMEWORK_COLORS[fw]} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg">{FRAMEWORK_NAMES[fw]}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {FRAMEWORK_DESCRIPTIONS[fw].slice(0, 100)}...
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{reqCount} Requirements</Badge>
                  {isActive && (
                    <Badge className={FRAMEWORK_COLORS[fw]}>Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="mappings">Cross-Framework Mappings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Framework Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${FRAMEWORK_COLORS[activeFramework]} text-white`}>
                    {(() => {
                      const Icon = FRAMEWORK_ICONS[activeFramework];
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  {FRAMEWORK_NAMES[activeFramework]}
                </CardTitle>
                <CardDescription>
                  {FRAMEWORK_DESCRIPTIONS[activeFramework]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Requirements</span>
                    <Badge variant="outline">{REQUIREMENT_COUNTS[activeFramework]}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Categories/Pillars</span>
                    <Badge variant="outline">{categories.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cross-Framework Mappings</span>
                    <Badge variant="outline">
                      {relevantOverlaps.reduce((sum, o) => sum + o.total_mappings, 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Categories/Pillars</CardTitle>
                <CardDescription>
                  Requirement distribution across {FRAMEWORK_NAMES[activeFramework]} domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const reqsInCategory = requirementsByCategory[cat.code]?.length || 0;
                    const percentage = (reqsInCategory / REQUIREMENT_COUNTS[activeFramework]) * 100;

                    return (
                      <div key={cat.code} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground">{reqsInCategory}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cross-Framework Coverage Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Cross-Framework Coverage from {FRAMEWORK_NAMES[activeFramework]}
              </CardTitle>
              <CardDescription>
                How compliance with {FRAMEWORK_NAMES[activeFramework]} maps to other frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relevantOverlaps.filter(o => o.source === activeFramework).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>Cross-framework mappings for {FRAMEWORK_NAMES[activeFramework]} are being developed</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {relevantOverlaps
                    .filter(o => o.source === activeFramework)
                    .map((overlap) => (
                      <Card key={`${overlap.source}-${overlap.target}`} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={FRAMEWORK_COLORS[activeFramework]}>
                              {FRAMEWORK_NAMES[activeFramework]}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge className={FRAMEWORK_COLORS[overlap.target as FrameworkCode]}>
                              {FRAMEWORK_NAMES[overlap.target as FrameworkCode]}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Mapped Requirements</span>
                              <span className="font-medium">{overlap.total_mappings}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Avg Coverage</span>
                              <span className="font-medium">{overlap.average_coverage}%</span>
                            </div>
                            <Progress value={overlap.average_coverage} className="h-2" />
                            <div className="flex gap-1 mt-2 text-xs">
                              <Badge variant="outline" className="bg-green-500/10">
                                {overlap.equivalent_count} Equivalent
                              </Badge>
                              <Badge variant="outline" className="bg-yellow-500/10">
                                {overlap.partial_count} Partial
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          {categories.map((cat) => {
            const reqs = requirementsByCategory[cat.code] || [];
            if (reqs.length === 0) return null;

            return (
              <Card key={cat.code}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                    <Badge variant="outline">{reqs.length}</Badge>
                  </CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reqs.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {req.article_number}
                            </Badge>
                            <span className="font-medium text-sm">{req.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {req.description}
                          </p>
                        </div>
                        <Badge
                          variant={req.priority === 'critical' ? 'destructive' :
                                  req.priority === 'high' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {req.priority}
                        </Badge>
                      </div>
                    ))}
                    {reqs.length > 5 && (
                      <Button variant="ghost" className="w-full mt-2">
                        View all {reqs.length} requirements
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Framework Mapping Matrix</CardTitle>
              <CardDescription>
                Complete mapping relationships between all compliance frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border bg-muted text-left">From / To</th>
                      {(Object.keys(FRAMEWORK_NAMES) as FrameworkCode[]).map((fw) => (
                        <th key={fw} className="p-2 border bg-muted text-center">
                          <Badge className={FRAMEWORK_COLORS[fw]}>
                            {FRAMEWORK_NAMES[fw]}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(FRAMEWORK_NAMES) as FrameworkCode[]).map((sourceFw) => (
                      <tr key={sourceFw}>
                        <td className="p-2 border bg-muted">
                          <Badge className={FRAMEWORK_COLORS[sourceFw]}>
                            {FRAMEWORK_NAMES[sourceFw]}
                          </Badge>
                        </td>
                        {(Object.keys(FRAMEWORK_NAMES) as FrameworkCode[]).map((targetFw) => {
                          if (sourceFw === targetFw) {
                            return (
                              <td key={targetFw} className="p-2 border text-center bg-muted/50">
                                -
                              </td>
                            );
                          }

                          const overlap = overlaps.find(
                            o => o.source === sourceFw && o.target === targetFw
                          );

                          return (
                            <td key={targetFw} className="p-2 border text-center">
                              {overlap ? (
                                <div className="space-y-1">
                                  <div className="font-medium">{overlap.total_mappings}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {overlap.average_coverage}% avg
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mapping Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Mapping Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Equivalent</div>
                    <p className="text-sm text-muted-foreground">
                      Requirements are identical or near-identical
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Partial</div>
                    <p className="text-sm text-muted-foreground">
                      Some coverage, may need additional controls
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Supports</div>
                    <p className="text-sm text-muted-foreground">
                      Helps meet requirement but not fully
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Related</div>
                    <p className="text-sm text-muted-foreground">
                      Conceptually related but different scope
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
