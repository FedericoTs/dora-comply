/**
 * Framework Detail Page
 *
 * Per-framework view showing:
 * - Category/pillar breakdown
 * - Requirement list with status
 * - Evidence mapping
 * - Related controls in other frameworks
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FrameworkCode,
  FRAMEWORK_NAMES,
  FRAMEWORK_DESCRIPTIONS,
  ALL_FRAMEWORK_CATEGORIES,
} from '@/lib/compliance/framework-types';
import { NIS2_REQUIREMENTS } from '@/lib/compliance/nis2-requirements';
import { GDPR_REQUIREMENTS } from '@/lib/compliance/gdpr-requirements';
import { ISO27001_REQUIREMENTS } from '@/lib/compliance/iso27001-requirements';
import { DORA_REQUIREMENTS } from '@/lib/compliance/dora-requirements-data';
import {
  getMappingsForFramework,
  getFrameworkOverlapSummary,
} from '@/lib/compliance/mappings';

// =============================================================================
// Types & Constants
// =============================================================================

interface PageProps {
  params: Promise<{ code: string }>;
}

const VALID_FRAMEWORKS: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];

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

const PRIORITY_COLORS = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
};

// =============================================================================
// Data Helpers
// =============================================================================

function getRequirementsForFramework(fw: FrameworkCode) {
  switch (fw) {
    case 'dora':
      return DORA_REQUIREMENTS;
    case 'nis2':
      return NIS2_REQUIREMENTS;
    case 'gdpr':
      return GDPR_REQUIREMENTS;
    case 'iso27001':
      return ISO27001_REQUIREMENTS;
    default:
      return [];
  }
}

// Helpers to normalize field access between DORARequirement and FrameworkRequirement
// DORARequirement: pillar, article_title, requirement_text, evidence_needed
// FrameworkRequirement: category, title, description, evidence_types

interface NormalizedRequirement {
  pillar?: string;
  category?: string;
  article_title?: string;
  title?: string;
  requirement_text?: string;
  description?: string;
  evidence_needed?: string[];
  evidence_types?: string[];
}

function getRequirementCategory(req: NormalizedRequirement, categoryCode: string): boolean {
  // For DORA requirements, pillar is uppercase (e.g., 'ICT_RISK')
  // Category codes are lowercase (e.g., 'ict_risk')
  if (req.pillar) {
    return req.pillar.toLowerCase() === categoryCode.toLowerCase();
  }
  if (req.category) {
    return req.category.toLowerCase() === categoryCode.toLowerCase();
  }
  return false;
}

function getRequirementTitle(req: NormalizedRequirement): string {
  return req.title || req.article_title || '';
}

function getRequirementDescription(req: NormalizedRequirement): string {
  return req.description || req.requirement_text || '';
}

function getRequirementEvidence(req: NormalizedRequirement): string[] {
  return req.evidence_types || req.evidence_needed || [];
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const frameworkCode = code as FrameworkCode;

  if (!VALID_FRAMEWORKS.includes(frameworkCode)) {
    return { title: 'Framework Not Found' };
  }

  return {
    title: `${FRAMEWORK_NAMES[frameworkCode]} | Frameworks | DORA Comply`,
    description: FRAMEWORK_DESCRIPTIONS[frameworkCode],
  };
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

// =============================================================================
// Main Content
// =============================================================================

async function FrameworkDetailContent({ code }: { code: FrameworkCode }) {
  const requirements = getRequirementsForFramework(code);
  const categories = ALL_FRAMEWORK_CATEGORIES[code] || [];
  const mappings = getMappingsForFramework(code);
  const Icon = FRAMEWORK_ICONS[code];

  // Group requirements by category
  const requirementsByCategory = categories.reduce((acc, cat) => {
    acc[cat.code] = requirements.filter((r) => getRequirementCategory(r, cat.code));
    return acc;
  }, {} as Record<string, Array<(typeof requirements)[number]>>);

  // Count by priority
  const priorityCounts = {
    critical: requirements.filter((r) => r.priority === 'critical').length,
    high: requirements.filter((r) => r.priority === 'high').length,
    medium: requirements.filter((r) => r.priority === 'medium').length,
    low: requirements.filter((r) => r.priority === 'low').length,
  };

  // Get overlap summaries with other frameworks
  const otherFrameworks = VALID_FRAMEWORKS.filter((f) => f !== code);
  const overlapSummaries = otherFrameworks.map((target) =>
    getFrameworkOverlapSummary(code, target)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/frameworks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className={`p-3 rounded-lg ${FRAMEWORK_COLORS[code]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {FRAMEWORK_NAMES[code]}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {FRAMEWORK_DESCRIPTIONS[code]}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {requirements.length} Requirements
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{priorityCounts.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{priorityCounts.high}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cross-Mappings</p>
                <p className="text-2xl font-bold">{mappings.length}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="requirements">All Requirements</TabsTrigger>
          <TabsTrigger value="mappings">Cross-Framework</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const reqs = requirementsByCategory[cat.code] || [];
              const criticalCount = reqs.filter((r) => r.priority === 'critical').length;
              const highCount = reqs.filter((r) => r.priority === 'high').length;

              return (
                <Card key={cat.code} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Requirements</span>
                        <Badge variant="outline">{reqs.length}</Badge>
                      </div>
                      {(criticalCount > 0 || highCount > 0) && (
                        <div className="flex gap-2">
                          {criticalCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {criticalCount} Critical
                            </Badge>
                          )}
                          {highCount > 0 && (
                            <Badge className="bg-orange-500 text-xs">
                              {highCount} High
                            </Badge>
                          )}
                        </div>
                      )}
                      <Progress
                        value={(reqs.length / requirements.length) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          {categories.map((cat) => {
            const reqs = requirementsByCategory[cat.code] || [];
            if (reqs.length === 0) return null;

            return (
              <Card key={cat.code}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <Badge variant="outline">{reqs.length}</Badge>
                  </div>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reqs.map((req) => {
                      const evidence = getRequirementEvidence(req);
                      return (
                        <div
                          key={req.id}
                          className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-mono">
                                {req.article_number}
                              </Badge>
                              <span className="font-medium text-sm">{getRequirementTitle(req)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {getRequirementDescription(req)}
                            </p>
                            {evidence.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {evidence.slice(0, 3).map((et) => (
                                  <Badge key={et} variant="secondary" className="text-xs">
                                    {et}
                                  </Badge>
                                ))}
                                {evidence.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{evidence.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={`ml-2 shrink-0 ${PRIORITY_COLORS[req.priority]}`}>
                            {req.priority}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Cross-Framework Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {overlapSummaries.map((summary) => (
                <Card key={summary.target}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={FRAMEWORK_COLORS[code]}>{FRAMEWORK_NAMES[code]}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className={FRAMEWORK_COLORS[summary.target as FrameworkCode]}>
                        {FRAMEWORK_NAMES[summary.target as FrameworkCode]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Mappings</span>
                        <span className="font-medium">{summary.total_mappings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg Coverage</span>
                        <span className="font-medium">{summary.average_coverage}%</span>
                      </div>
                      <Progress value={summary.average_coverage} className="h-2" />
                      <div className="flex gap-1 flex-wrap">
                        {summary.equivalent_count > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-500/10">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {summary.equivalent_count} Equivalent
                          </Badge>
                        )}
                        {summary.partial_count > 0 && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10">
                            {summary.partial_count} Partial
                          </Badge>
                        )}
                        {summary.supports_count > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10">
                            {summary.supports_count} Supports
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <Link href={`/frameworks/${summary.target}`}>
                          View {FRAMEWORK_NAMES[summary.target as FrameworkCode]}
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>

          {overlapSummaries.every((s) => s.total_mappings === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Cross-Framework Mappings</h3>
                <p className="text-muted-foreground">
                  Cross-framework mappings for {FRAMEWORK_NAMES[code]} are being developed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function FrameworkDetailPage({ params }: PageProps) {
  const { code } = await params;
  const frameworkCode = code as FrameworkCode;

  if (!VALID_FRAMEWORKS.includes(frameworkCode)) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FrameworkDetailContent code={frameworkCode} />
    </Suspense>
  );
}
