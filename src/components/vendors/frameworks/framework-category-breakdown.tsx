'use client';

/**
 * Framework Category Breakdown Component
 *
 * Displays category-level compliance breakdown for a framework.
 * Shows progress bars and requirement counts per category.
 */

import { CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FrameworkCode, ComplianceStatus } from '@/lib/compliance/framework-types';
import { ALL_FRAMEWORK_CATEGORIES } from '@/lib/compliance/framework-types';

interface CategoryScore {
  score: number;
  status: ComplianceStatus;
  requirements_met: number;
  requirements_total: number;
}

interface FrameworkCategoryBreakdownProps {
  framework: FrameworkCode;
  categoryScores: Record<string, CategoryScore>;
}

const getStatusIcon = (status: ComplianceStatus) => {
  switch (status) {
    case 'compliant':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'partially_compliant':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'non_compliant':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-muted" />;
  }
};

const getProgressColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const getStatusBadge = (status: ComplianceStatus) => {
  const styles: Record<ComplianceStatus, { bg: string; text: string; label: string }> = {
    compliant: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Complete' },
    partially_compliant: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Partial' },
    non_compliant: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Gaps' },
    not_assessed: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Pending' },
    not_applicable: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'N/A' },
  };
  const style = styles[status];
  return (
    <Badge variant="outline" className={cn('text-xs', style.bg, style.text)}>
      {style.label}
    </Badge>
  );
};

export function FrameworkCategoryBreakdown({
  framework,
  categoryScores,
}: FrameworkCategoryBreakdownProps) {
  const categories = ALL_FRAMEWORK_CATEGORIES[framework] || [];

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No categories defined for this framework.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Category Breakdown</CardTitle>
        <CardDescription>Compliance status by requirement category</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1">
        {categories.map((category) => {
          const score = categoryScores[category.code] || {
            score: 0,
            status: 'not_assessed' as ComplianceStatus,
            requirements_met: 0,
            requirements_total: 0,
          };

          return (
            <div
              key={category.code}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                'hover:bg-muted/50 cursor-pointer',
                score.status === 'compliant' && 'border-emerald-500/30 bg-emerald-500/5',
                score.status === 'partially_compliant' && 'border-amber-500/30 bg-amber-500/5',
                score.status === 'non_compliant' && 'border-red-500/30 bg-red-500/5'
              )}
            >
              {/* Status Icon */}
              <div className="shrink-0">{getStatusIcon(score.status)}</div>

              {/* Category Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{category.name}</span>
                  {getStatusBadge(score.status)}
                </div>

                {/* Progress Bar */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', getProgressColor(score.score))}
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {score.requirements_met}/{score.requirements_total}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    'text-lg font-semibold',
                    score.score >= 80 && 'text-emerald-600',
                    score.score >= 60 && score.score < 80 && 'text-amber-600',
                    score.score < 60 && 'text-red-600'
                  )}
                >
                  {score.score}%
                </span>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
