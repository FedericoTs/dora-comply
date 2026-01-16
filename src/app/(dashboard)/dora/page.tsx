/**
 * DORA Overview Page
 *
 * Main entry point for DORA compliance module.
 * Shows compliance overview, pillar status, and navigation to DORA features.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Shield,
  Database,
  AlertTriangle,
  FlaskConical,
  Network,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrganization } from '@/lib/org/context';
import { hasFrameworkAccess, hasModuleAccess } from '@/lib/licensing/check-access-server';
import { LockedFramework } from '@/components/licensing/locked-module';
import { getDORADashboardData } from '@/lib/compliance/maturity-history';

export const metadata: Metadata = {
  title: 'DORA Compliance | DORA Comply',
  description: 'Digital Operational Resilience Act compliance management',
};

// =============================================================================
// Types
// =============================================================================

interface PillarStatus {
  id: string;
  name: string;
  articles: string;
  icon: typeof Shield;
  percent: number;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
}

interface ModuleLink {
  name: string;
  description: string;
  href: string;
  icon: typeof Shield;
  module: 'roi' | 'incidents' | 'testing' | 'tprm';
  status?: 'active' | 'locked';
}

// =============================================================================
// Locked State (shown when DORA not licensed)
// =============================================================================

function DORALockedState() {
  return (
    <LockedFramework
      framework="dora"
      features={[
        'Register of Information (15 ESA templates)',
        'ICT Incident Reporting (Article 19)',
        'TLPT Testing Management (Article 26)',
        'Concentration Risk Analysis',
        'L0-L4 Maturity Assessment',
        'Board-Ready Compliance Reports',
      ]}
      upgradeTier="professional"
    />
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Pillar Status Card
// =============================================================================

function PillarStatusCard({ pillar }: { pillar: PillarStatus }) {
  const Icon = pillar.icon;

  const statusColors = {
    compliant: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    partial: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    non_compliant: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    not_assessed: 'text-muted-foreground bg-muted',
  };

  const progressColors = {
    compliant: '[&>div]:bg-emerald-500',
    partial: '[&>div]:bg-amber-500',
    non_compliant: '[&>div]:bg-red-500',
    not_assessed: '[&>div]:bg-muted-foreground',
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${statusColors[pillar.status]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{pillar.name}</p>
            <p className="text-xs text-muted-foreground">{pillar.articles}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{pillar.percent}%</span>
          </div>
          <Progress value={pillar.percent} className={`h-2 ${progressColors[pillar.status]}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Module Link Card
// =============================================================================

function ModuleLinkCard({ module, hasAccess }: { module: ModuleLink; hasAccess: boolean }) {
  const Icon = module.icon;

  if (!hasAccess) {
    return (
      <Card className="border-dashed opacity-75">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">{module.name}</CardTitle>
          <CardDescription>{module.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/settings/billing">
              Upgrade to Unlock
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-xs">Active</Badge>
        </div>
        <CardTitle className="text-base">{module.name}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="sm" className="w-full" asChild>
          <Link href={module.href}>
            Open
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DORA Dashboard Content
// =============================================================================

async function DORADashboardContent() {
  const org = await getOrganization();
  if (!org) {
    return <DORALockedState />;
  }

  // Fetch module access and dashboard data in parallel
  const [roiAccess, incidentsAccess, testingAccess, tprmAccess, dashboardResult] = await Promise.all([
    hasModuleAccess(org.id, 'dora', 'roi'),
    hasModuleAccess(org.id, 'dora', 'incidents'),
    hasModuleAccess(org.id, 'dora', 'testing'),
    hasModuleAccess(org.id, 'dora', 'tprm'),
    getDORADashboardData(),
  ]);

  // Map pillar IDs to icons
  const pillarIcons: Record<string, typeof Shield> = {
    ict_risk: Shield,
    incident: AlertTriangle,
    testing: FlaskConical,
    tprm: Network,
    sharing: FileText,
  };

  // Use real data or fallback to defaults
  const dashboardData = dashboardResult.success && dashboardResult.data
    ? dashboardResult.data
    : null;

  // Build pillars from real data
  const pillars: PillarStatus[] = dashboardData
    ? dashboardData.pillars.map((p) => ({
        id: p.id,
        name: p.name,
        articles: p.articles,
        icon: pillarIcons[p.id] || Shield,
        percent: p.percent,
        status: p.status,
      }))
    : [
        { id: 'ict_risk', name: 'ICT Risk Management', articles: 'Articles 5-16', icon: Shield, percent: 0, status: 'not_assessed' as const },
        { id: 'incident', name: 'Incident Reporting', articles: 'Articles 17-23', icon: AlertTriangle, percent: 0, status: 'not_assessed' as const },
        { id: 'testing', name: 'Resilience Testing', articles: 'Articles 24-27', icon: FlaskConical, percent: 0, status: 'not_assessed' as const },
        { id: 'tprm', name: 'Third Party Risk', articles: 'Articles 28-44', icon: Network, percent: 0, status: 'not_assessed' as const },
        { id: 'sharing', name: 'Information Sharing', articles: 'Article 45', icon: FileText, percent: 0, status: 'not_assessed' as const },
      ];

  // Module links
  const modules: ModuleLink[] = [
    {
      name: 'Register of Information',
      description: 'ESA RoI templates for ICT third-party arrangements',
      href: '/roi',
      icon: Database,
      module: 'roi',
    },
    {
      name: 'ICT Incidents',
      description: 'Major incident reporting per Article 19',
      href: '/incidents',
      icon: AlertTriangle,
      module: 'incidents',
    },
    {
      name: 'Resilience Testing',
      description: 'TLPT and operational resilience testing',
      href: '/testing',
      icon: FlaskConical,
      module: 'testing',
    },
    {
      name: 'Concentration Risk',
      description: 'ICT third-party concentration analysis',
      href: '/concentration',
      icon: Network,
      module: 'tprm',
    },
  ];

  const moduleAccessMap: Record<string, boolean> = {
    roi: roiAccess,
    incidents: incidentsAccess,
    testing: testingAccess,
    tprm: tprmAccess,
  };

  // Calculate overall stats from real data
  const overallPercent = dashboardData?.overall_percent ?? 0;
  const daysUntilDeadline = Math.ceil((new Date('2026-01-17').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Gap stats
  const criticalGaps = dashboardData?.gaps.critical ?? 0;
  const highGaps = dashboardData?.gaps.high ?? 0;
  const totalGaps = dashboardData?.gaps.total ?? 64;
  const metRequirements = dashboardData?.gaps.met ?? 0;
  const estimatedWeeks = dashboardData?.estimated_weeks ?? 0;

  // Count pillars by status
  const compliantPillars = pillars.filter((p) => p.status === 'compliant').length;
  const needsAttentionPillars = pillars.filter((p) => p.status === 'partial' || p.status === 'non_compliant').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DORA Compliance</h1>
          <p className="text-muted-foreground">
            Digital Operational Resilience Act (EU 2022/2554)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Enforcement Date</p>
            <p className="font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {daysUntilDeadline} days
            </p>
          </div>
          <Button asChild>
            <Link href="/compliance/trends">
              View Trends
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">{overallPercent}%</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1">Overall DORA Readiness</h3>
              <Progress value={overallPercent} className="h-3 mb-2" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {compliantPillars} pillar{compliantPillars !== 1 ? 's' : ''} on track
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  {needsAttentionPillars} pillar{needsAttentionPillars !== 1 ? 's' : ''} need{needsAttentionPillars === 1 ? 's' : ''} attention
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Status Grid */}
      <div>
        <h2 className="text-lg font-medium mb-4">DORA 5 Pillars</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {pillars.map((pillar) => (
            <PillarStatusCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>

      {/* Module Links */}
      <div>
        <h2 className="text-lg font-medium mb-4">DORA Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleLinkCard
              key={module.module}
              module={module}
              hasAccess={moduleAccessMap[module.module]}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalGaps > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {criticalGaps + highGaps}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalGaps} critical, {highGaps} high priority
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requirements Met
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metRequirements} / {totalGaps}</div>
            <p className="text-xs text-muted-foreground">DORA articles addressed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Remediation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estimatedWeeks > 0 ? `${estimatedWeeks} weeks` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">To full compliance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function DORAPage() {
  const org = await getOrganization();

  // Check if org has DORA access
  if (!org) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DORA Compliance</h1>
          <p className="text-muted-foreground">
            Digital Operational Resilience Act (EU 2022/2554)
          </p>
        </div>
        <DORALockedState />
      </div>
    );
  }

  const hasDORA = await hasFrameworkAccess(org.id, 'dora');

  if (!hasDORA) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DORA Compliance</h1>
          <p className="text-muted-foreground">
            Digital Operational Resilience Act (EU 2022/2554)
          </p>
        </div>
        <DORALockedState />
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DORADashboardContent />
    </Suspense>
  );
}
