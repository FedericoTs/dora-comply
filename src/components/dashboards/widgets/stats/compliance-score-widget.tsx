'use client';

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface ComplianceScoreWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

export function ComplianceScoreWidget({ title, config }: ComplianceScoreWidgetProps) {
  const [data, setData] = useState<{ score: number; trend?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/compliance-score');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center justify-center h-full">
        <div className="h-20 w-20 bg-muted rounded-full" />
      </div>
    );
  }

  const score = data?.score ?? 0;
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Target className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Compliance Score'}</span>
      </div>
      <div className="relative">
        <svg className="h-24 w-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Overall compliance</p>
    </div>
  );
}
