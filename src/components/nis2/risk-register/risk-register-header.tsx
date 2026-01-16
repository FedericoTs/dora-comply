'use client';

import Link from 'next/link';
import { Plus, Download, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RiskSummary } from '@/lib/nis2/types';

interface RiskRegisterHeaderProps {
  summary: RiskSummary | null;
}

export function RiskRegisterHeader({ summary }: RiskRegisterHeaderProps) {
  const criticalCount = (summary?.critical_residual ?? 0) + (summary?.high_residual ?? 0);
  const withinTolerance = summary
    ? summary.total_risks - criticalCount - (summary.not_assessed ?? 0)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Register</h1>
          <p className="text-muted-foreground mt-1">
            NIS2 ICT risk assessment and treatment tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/nis2/heat-map" className="gap-2">
              <Target className="h-4 w-4" />
              Heat Map
            </Link>
          </Button>
          <Button asChild>
            <Link href="/nis2/risk-register/new" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Risk
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {summary && summary.total_risks > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Risks"
            value={summary.total_risks}
            subtext={`${summary.not_assessed ?? 0} unassessed`}
          />
          <SummaryCard
            label="Critical/High"
            value={criticalCount}
            valueClassName="text-error"
            subtext="Require attention"
          />
          <SummaryCard
            label="Within Tolerance"
            value={withinTolerance}
            valueClassName="text-success"
            subtext={`${Math.round((withinTolerance / summary.total_risks) * 100)}% of total`}
          />
          <SummaryCard
            label="Avg. Control Effectiveness"
            value={summary.avg_control_effectiveness !== null ? `${Math.round(summary.avg_control_effectiveness)}%` : '-'}
            subtext="Across all risks"
          />
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number | string;
  valueClassName?: string;
  subtext?: string;
}

function SummaryCard({ label, value, valueClassName, subtext }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClassName ?? ''}`}>{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
      )}
    </div>
  );
}
