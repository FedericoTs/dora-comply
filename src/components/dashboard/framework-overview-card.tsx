'use client';

/**
 * Framework Overview Card
 *
 * Dashboard widget showing compliance status across enabled frameworks.
 * Displays a summary of multi-framework readiness.
 */

import Link from 'next/link';
import { Shield, Layers, FileText, Target, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FrameworkCode } from '@/lib/compliance/framework-types';

// ============================================================================
// Types
// ============================================================================

interface FrameworkStatus {
  code: FrameworkCode;
  score: number; // 0-100
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  criticalGaps: number;
}

interface FrameworkOverviewCardProps {
  enabledFrameworks: FrameworkCode[];
  frameworkStatuses?: FrameworkStatus[];
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const FRAMEWORK_CONFIG: Record<FrameworkCode, {
  name: string;
  shortName: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
}> = {
  dora: {
    name: 'DORA',
    shortName: 'DORA',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
  },
  nis2: {
    name: 'NIS2',
    shortName: 'NIS2',
    icon: Layers,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
  },
  gdpr: {
    name: 'GDPR',
    shortName: 'GDPR',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
  },
  iso27001: {
    name: 'ISO 27001',
    shortName: 'ISO',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
  },
};

// ============================================================================
// Component
// ============================================================================

export function FrameworkOverviewCard({
  enabledFrameworks,
  frameworkStatuses,
  className,
}: FrameworkOverviewCardProps) {
  // Generate mock statuses if none provided (for demo/development)
  const statuses: FrameworkStatus[] = frameworkStatuses || enabledFrameworks.map(code => ({
    code,
    score: code === 'nis2' ? 72 : code === 'dora' ? 58 : code === 'gdpr' ? 85 : 45,
    status: code === 'gdpr' ? 'partial' : code === 'nis2' ? 'partial' : 'non_compliant',
    criticalGaps: code === 'dora' ? 5 : code === 'nis2' ? 3 : code === 'gdpr' ? 1 : 8,
  }));

  // Calculate overall readiness
  const overallScore = statuses.length > 0
    ? Math.round(statuses.reduce((sum, s) => sum + s.score, 0) / statuses.length)
    : 0;

  const totalCriticalGaps = statuses.reduce((sum, s) => sum + s.criticalGaps, 0);

  if (enabledFrameworks.length === 0) {
    return (
      <Card className={cn('card-elevated', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Frameworks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No frameworks enabled yet
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/frameworks">
                Configure Frameworks
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('card-elevated', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Multi-Framework Compliance
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {enabledFrameworks.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">{overallScore}%</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Overall Readiness</p>
            <Progress value={overallScore} className="h-2 mt-1" />
          </div>
          {totalCriticalGaps > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalCriticalGaps} Critical Gaps
            </Badge>
          )}
        </div>

        {/* Framework List */}
        <div className="space-y-2">
          {statuses.map((status) => {
            const config = FRAMEWORK_CONFIG[status.code];
            const Icon = config.icon;

            return (
              <Link
                key={status.code}
                href={`/frameworks/${status.code}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={cn('p-1.5 rounded', config.bgColor)}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{config.name}</span>
                    {status.criticalGaps > 0 && (
                      <span className="text-xs text-red-600">
                        {status.criticalGaps} gaps
                      </span>
                    )}
                  </div>
                  <Progress value={status.score} className="h-1.5 mt-1" />
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {status.score}%
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        {/* Action Button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/frameworks">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Full Analysis
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
