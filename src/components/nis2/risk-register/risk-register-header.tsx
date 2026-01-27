'use client';

import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskStatusDot } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import type { RiskSummary } from '@/lib/nis2/types';

interface RiskRegisterHeaderProps {
  summary: RiskSummary | null;
}

export function RiskRegisterHeader({ summary }: RiskRegisterHeaderProps) {
  // Extract risk counts by level (use residual if available, otherwise inherent)
  const criticalCount = summary?.critical_residual ?? 0;
  const highCount = summary?.high_residual ?? 0;
  const mediumCount = summary?.medium_residual ?? 0;
  const lowCount = summary?.low_residual ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Register</h1>
          <p className="text-muted-foreground mt-1">
            ICT risk assessment and treatment tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/nis2/risk-register/new" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Risk
            </Link>
          </Button>
        </div>
      </div>

      {/* Risk Level Summary Cards */}
      {summary && summary.total_risks > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <RiskLevelCard
            level="critical"
            count={criticalCount}
            total={summary.total_risks}
          />
          <RiskLevelCard
            level="high"
            count={highCount}
            total={summary.total_risks}
          />
          <RiskLevelCard
            level="medium"
            count={mediumCount}
            total={summary.total_risks}
          />
          <RiskLevelCard
            level="low"
            count={lowCount}
            total={summary.total_risks}
          />
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{summary.total_risks}</p>
            <p className="text-xs text-muted-foreground">
              {summary.avg_control_effectiveness !== null
                ? `${Math.round(summary.avg_control_effectiveness)}% control effectiveness`
                : 'No controls applied'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface RiskLevelCardProps {
  level: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  total: number;
}

function RiskLevelCard({ level, count, total }: RiskLevelCardProps) {
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const bgColors: Record<string, string> = {
    critical: 'bg-error/10 border-error/20',
    high: 'bg-orange-500/10 border-orange-500/20',
    medium: 'bg-warning/10 border-warning/20',
    low: 'bg-success/10 border-success/20',
  };

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={cn('rounded-lg border p-4', bgColors[level])}>
      <div className="flex items-center gap-2 mb-1">
        <RiskStatusDot status={level} />
        <span className="text-sm font-medium">{labels[level]}</span>
      </div>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{percentage}% of total</p>
    </div>
  );
}
