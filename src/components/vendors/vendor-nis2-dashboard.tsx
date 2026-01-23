'use client';

/**
 * Vendor NIS2 Dashboard Component
 *
 * Displays NIS2 compliance analysis for a specific vendor:
 * - Supply chain security assessment (Article 21.2d)
 * - Vendor's contribution to organization's NIS2 compliance
 * - Risk assessment specific to this vendor relationship
 * - Recommendations for compliance improvement
 */

import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Link2,
  FileText,
  Info,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VendorNIS2DashboardProps {
  vendorId: string;
  vendorName: string;
}

// NIS2 Article 21.2(d) Supply Chain Security Requirements
const SUPPLY_CHAIN_REQUIREMENTS = [
  {
    id: 'sc-1',
    requirement: 'Vendor risk assessment procedures',
    description: 'Documented process for assessing security risks of suppliers',
    article: '21.2(d)',
    weight: 20,
  },
  {
    id: 'sc-2',
    requirement: 'Security requirements in contracts',
    description: 'Contractual security obligations and SLAs',
    article: '21.2(d)',
    weight: 25,
  },
  {
    id: 'sc-3',
    requirement: 'Incident notification clauses',
    description: 'Requirements for security incident reporting',
    article: '21.2(d)',
    weight: 15,
  },
  {
    id: 'sc-4',
    requirement: 'Security certification verification',
    description: 'Evidence of security certifications (ISO 27001, SOC 2)',
    article: '21.2(d)',
    weight: 20,
  },
  {
    id: 'sc-5',
    requirement: 'Continuous monitoring',
    description: 'Ongoing monitoring of vendor security posture',
    article: '21.2(d)',
    weight: 20,
  },
];

// Simulated compliance assessment (would come from real data in production)
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- vendorId will be used when fetching real data
function assessVendorNIS2Compliance(vendorId: string) {
  // This would be calculated from actual vendor data
  const assessments: Record<string, { status: 'compliant' | 'partial' | 'gap'; evidence: string }> = {
    'sc-1': { status: 'compliant', evidence: 'Risk assessment completed' },
    'sc-2': { status: 'partial', evidence: 'Contract exists but missing SLAs' },
    'sc-3': { status: 'gap', evidence: 'No incident notification clause' },
    'sc-4': { status: 'compliant', evidence: 'SOC 2 Type II verified' },
    'sc-5': { status: 'partial', evidence: 'Manual monitoring only' },
  };

  let totalScore = 0;
  let maxScore = 0;

  for (const req of SUPPLY_CHAIN_REQUIREMENTS) {
    maxScore += req.weight;
    const assessment = assessments[req.id];
    if (assessment?.status === 'compliant') {
      totalScore += req.weight;
    } else if (assessment?.status === 'partial') {
      totalScore += req.weight * 0.5;
    }
  }

  return {
    overallScore: Math.round((totalScore / maxScore) * 100),
    assessments,
  };
}

export function VendorNIS2Dashboard({ vendorId, vendorName }: VendorNIS2DashboardProps) {
  const { overallScore, assessments } = assessVendorNIS2Compliance(vendorId);

  const getStatusColor = (status: 'compliant' | 'partial' | 'gap') => {
    switch (status) {
      case 'compliant':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'partial':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'gap':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    }
  };

  const getStatusIcon = (status: 'compliant' | 'partial' | 'gap') => {
    switch (status) {
      case 'compliant':
        return CheckCircle2;
      case 'partial':
        return AlertTriangle;
      case 'gap':
        return ShieldAlert;
    }
  };

  const getStatusLabel = (status: 'compliant' | 'partial' | 'gap') => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'partial':
        return 'Partial';
      case 'gap':
        return 'Gap';
    }
  };

  const gaps = SUPPLY_CHAIN_REQUIREMENTS.filter(
    req => assessments[req.id]?.status === 'gap'
  );
  const partials = SUPPLY_CHAIN_REQUIREMENTS.filter(
    req => assessments[req.id]?.status === 'partial'
  );

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* NIS2 Supply Chain Score */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              NIS2 Supply Chain Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallScore / 100) * 226} 226`}
                    className={cn(
                      overallScore >= 80 ? 'text-emerald-500' :
                      overallScore >= 60 ? 'text-amber-500' :
                      'text-red-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{overallScore}%</span>
                </div>
              </div>
              <div className="flex-1">
                <Badge
                  variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}
                >
                  {overallScore >= 80 ? 'Compliant' : overallScore >= 60 ? 'Partial' : 'Non-Compliant'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Article 21.2(d) Assessment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-600">
                  {SUPPLY_CHAIN_REQUIREMENTS.filter(r => assessments[r.id]?.status === 'compliant').length}
                </div>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="text-2xl font-bold text-amber-600">
                  {partials.length}
                </div>
                <p className="text-xs text-muted-foreground">Partial</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-2xl font-bold text-red-600">
                  {gaps.length}
                </div>
                <p className="text-xs text-muted-foreground">Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Article 21.2(d) Explanation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">NIS2 Article 21.2(d) - Supply Chain Security</p>
              <p className="text-sm text-muted-foreground mt-1">
                Requires essential and important entities to implement supply chain security measures,
                including security-related aspects concerning relationships with direct suppliers and service providers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Supply Chain Requirements
          </CardTitle>
          <CardDescription>
            Assessment of NIS2 supply chain security requirements for this vendor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SUPPLY_CHAIN_REQUIREMENTS.map((req) => {
            const assessment = assessments[req.id];
            const StatusIcon = getStatusIcon(assessment?.status || 'gap');

            return (
              <div
                key={req.id}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <div className={cn('p-2 rounded-lg', getStatusColor(assessment?.status || 'gap'))}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{req.requirement}</p>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(assessment?.status || 'gap')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                  {assessment?.evidence && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {assessment.evidence}
                    </p>
                  )}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs">
                        {req.weight}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Weight: {req.weight}% of total score</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Gaps & Recommendations */}
      {(gaps.length > 0 || partials.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-4 w-4" />
              Improvement Recommendations
            </CardTitle>
            <CardDescription>
              Actions to improve NIS2 supply chain compliance for {vendorName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.map((gap) => (
              <div
                key={gap.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10"
              >
                <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{gap.requirement}</p>
                  <p className="text-sm text-muted-foreground">{gap.description}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Priority: High - Required for Article {gap.article} compliance
                  </p>
                </div>
              </div>
            ))}
            {partials.map((partial) => (
              <div
                key={partial.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{partial.requirement}</p>
                  <p className="text-sm text-muted-foreground">{partial.description}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Priority: Medium - Needs improvement for full compliance
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/nis2">
            <Shield className="h-4 w-4 mr-2" />
            Organization NIS2 Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/nis2/gaps">
            <AlertTriangle className="h-4 w-4 mr-2" />
            View All NIS2 Gaps
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/vendors/${vendorId}?tab=contracts`}>
            <FileText className="h-4 w-4 mr-2" />
            Review Contracts
          </Link>
        </Button>
      </div>
    </div>
  );
}
