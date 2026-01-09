'use client';

/**
 * Framework Compliance Card Component
 *
 * Displays detailed compliance score for a single framework.
 * Shows circular score indicator, status, and requirements progress.
 */

import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FrameworkCode, FrameworkComplianceResult } from '@/lib/compliance/framework-types';
import { FRAMEWORK_CONFIG, STATUS_STYLES } from './framework-selector';

interface FrameworkComplianceCardProps {
  framework: FrameworkCode;
  result: FrameworkComplianceResult;
}

export function FrameworkComplianceCard({ framework, result }: FrameworkComplianceCardProps) {
  const config = FRAMEWORK_CONFIG[framework];
  const Icon = config.icon;
  const statusStyle = STATUS_STYLES[result.status];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-success';
    if (score >= 60) return 'stroke-warning';
    return 'stroke-error';
  };

  // Calculate stroke dash for circular progress
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (result.overall_score / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{config.name} Compliance</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs', statusStyle.bg, statusStyle.text)}
          >
            {statusStyle.label}
          </Badge>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Circular Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn('transition-all duration-500', getScoreRingColor(result.overall_score))}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-2xl font-bold', getScoreColor(result.overall_score))}>
                {result.overall_score}%
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {/* Requirements Progress */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm">
                <span className="font-semibold">{result.requirements_met}</span>
                <span className="text-muted-foreground"> of {result.requirements_total} requirements met</span>
              </span>
            </div>

            {/* Critical Gaps */}
            {result.critical_gaps.length > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  <span className="font-semibold text-warning">{result.critical_gaps.length}</span>
                  <span className="text-muted-foreground"> critical gaps</span>
                </span>
              </div>
            )}

            {/* Last Assessed */}
            {result.last_assessed_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Last assessed: {new Date(result.last_assessed_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-semibold">{result.requirements_met}</span>
            </div>
            <p className="text-xs text-muted-foreground">Compliant</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-semibold">
                {result.requirements_total - result.requirements_met - result.critical_gaps.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Partial</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4 text-error" />
              <span className="font-semibold">{result.critical_gaps.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Gaps</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
