'use client';

import { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface ComplianceGaugeWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface ComplianceData {
  score: number;
  pillars: {
    id: string;
    name: string;
    score: number;
  }[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-teal-500';
  if (score >= 40) return 'text-amber-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-teal-500';
  if (score >= 40) return 'stroke-amber-500';
  if (score >= 20) return 'stroke-orange-500';
  return 'stroke-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Needs Work';
  return 'Critical';
}

function CircularGauge({
  score,
  size = 120,
  strokeWidth = 10,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('transition-all duration-700 ease-out', getStrokeColor(score))}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', getScoreColor(score))}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

export function ComplianceGaugeWidget({ title, config }: ComplianceGaugeWidgetProps) {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  const framework = config.framework || 'nis2';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/compliance-gauge?framework=${framework}`);
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
  }, [framework]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="h-28 w-28 rounded-full bg-muted" />
      </div>
    );
  }

  const score = data?.score ?? 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Gauge className="h-4 w-4" />
        <span className="text-sm font-medium">
          {title || `${framework.toUpperCase()} Compliance`}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <CircularGauge score={score} />
        {data?.pillars && data.pillars.length > 0 && (
          <div className="mt-4 w-full space-y-1">
            {data.pillars.slice(0, 3).map((pillar) => (
              <div key={pillar.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate flex-1">{pillar.name}</span>
                <span className={cn('font-medium ml-2', getScoreColor(pillar.score))}>
                  {pillar.score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
