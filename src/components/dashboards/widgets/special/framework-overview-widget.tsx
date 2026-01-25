'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Shield, FileText, Target, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface FrameworkOverviewWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface FrameworkStatus {
  code: string;
  name: string;
  score: number;
  criticalGaps: number;
}

interface FrameworkData {
  frameworks: FrameworkStatus[];
  overallScore: number;
}

const FRAMEWORK_ICONS: Record<string, typeof Shield> = {
  dora: Shield,
  nis2: Layers,
  gdpr: FileText,
  iso27001: Target,
};

const FRAMEWORK_COLORS: Record<string, { text: string; bg: string }> = {
  dora: { text: 'text-blue-600', bg: 'bg-blue-500' },
  nis2: { text: 'text-purple-600', bg: 'bg-purple-500' },
  gdpr: { text: 'text-green-600', bg: 'bg-green-500' },
  iso27001: { text: 'text-orange-600', bg: 'bg-orange-500' },
};

export function FrameworkOverviewWidget({ title, config }: FrameworkOverviewWidgetProps) {
  const [data, setData] = useState<FrameworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/framework-overview');
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
      <div className="h-full flex flex-col animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3 flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const frameworks = data?.frameworks || [];

  if (frameworks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Layers className="h-8 w-8 mb-2" />
        <p className="text-sm">No frameworks enabled</p>
        <Link
          href="/frameworks"
          className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
        >
          Configure Frameworks
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const totalGaps = frameworks.reduce((sum, f) => sum + f.criticalGaps, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-medium">{title || 'Framework Compliance'}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {frameworks.length} Active
        </Badge>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <span className="text-sm font-bold text-primary">{data?.overallScore ?? 0}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Overall Readiness</p>
          <Progress value={data?.overallScore ?? 0} className="h-1.5 mt-1" />
        </div>
        {totalGaps > 0 && (
          <Badge variant="destructive" className="text-xs shrink-0">
            {totalGaps} Gaps
          </Badge>
        )}
      </div>

      {/* Framework List */}
      <div className="flex-1 space-y-1.5 overflow-auto">
        {frameworks.map((framework) => {
          const Icon = FRAMEWORK_ICONS[framework.code] || Layers;
          const colors = FRAMEWORK_COLORS[framework.code] || { text: 'text-gray-600', bg: 'bg-gray-500' };

          return (
            <Link
              key={framework.code}
              href={`/frameworks/${framework.code}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={cn('p-1 rounded', colors.bg)}>
                <Icon className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{framework.name}</span>
                  {framework.criticalGaps > 0 && (
                    <span className="text-[10px] text-red-600">{framework.criticalGaps} gaps</span>
                  )}
                </div>
                <Progress value={framework.score} className="h-1 mt-1" />
              </div>
              <span className="text-xs font-medium tabular-nums">{framework.score}%</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
